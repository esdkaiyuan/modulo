import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../engines/bitmapEncoder';
import { floodFill } from '../engines/fill';
import { type PixelValue } from '../engines/modulo';
import { findClosestPaletteColor, PALETTE_16_COLORS, rgbToRgb332, rgbToRgb565, type ColorByteOrder, type ColorMode } from '../engines/colorProcessor';
import { formatCArray, formatColorArray, makeTextBlob } from '../engines/outputFormatter';

export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper';
export type HanddrawOutputFormat = 'c-array' | 'hex' | 'bin';

const defaultPalette = [
  '#20252A',
  '#8B9096',
  '#B7BBC0',
  '#FFFFFF',
  '#FF6B9D',
  '#7A5BD6',
  '#3C8CF0',
  '#53D769',
  '#FFD23F',
  '#FF8A16'
];

function createEmptyPixels(width: number, height: number): PixelValue[] {
  return Array.from({ length: width * height }, () => null);
}

function createCatPixels(width: number, height: number): PixelValue[] {
  const pixels = createEmptyPixels(width, height);
  if (width !== 32 || height !== 32) return pixels;

  const set = (x: number, y: number, color: PixelValue) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    pixels[y * width + x] = color;
  };
  const rect = (x: number, y: number, w: number, h: number, color: PixelValue) => {
    for (let py = y; py < y + h; py += 1) {
      for (let px = x; px < x + w; px += 1) set(px, py, color);
    }
  };

  const outline = '#20252A';
  const fur = '#AEB3B8';
  const shadow = '#8B9096';
  const pink = '#FF9BB4';
  const scarf = '#7A5BD6';
  const scarfLight = '#9A75EA';
  const white = '#FFFFFF';

  rect(8, 2, 3, 2, outline);
  rect(21, 2, 3, 2, outline);
  rect(7, 4, 5, 2, outline);
  rect(20, 4, 5, 2, outline);
  rect(6, 6, 3, 5, outline);
  rect(23, 6, 3, 5, outline);
  rect(5, 11, 2, 6, outline);
  rect(25, 11, 2, 6, outline);
  rect(6, 17, 3, 2, outline);
  rect(23, 17, 3, 2, outline);
  rect(9, 19, 14, 2, outline);

  rect(9, 5, 14, 13, fur);
  rect(10, 3, 2, 4, fur);
  rect(20, 3, 2, 4, fur);
  rect(7, 8, 18, 8, fur);
  rect(8, 15, 16, 4, white);
  rect(13, 12, 6, 5, white);
  rect(10, 6, 2, 5, shadow);
  rect(21, 6, 2, 5, shadow);
  rect(8, 13, 4, 2, pink);
  rect(21, 13, 4, 2, pink);
  rect(10, 5, 1, 3, pink);
  rect(21, 5, 1, 3, pink);
  rect(12, 11, 1, 3, outline);
  rect(20, 11, 1, 3, outline);
  rect(15, 14, 3, 1, outline);
  rect(14, 16, 2, 1, outline);
  rect(18, 16, 2, 1, outline);
  rect(16, 17, 2, 1, outline);

  rect(6, 19, 4, 2, scarf);
  rect(9, 20, 5, 2, scarfLight);
  rect(14, 21, 9, 2, scarf);
  rect(19, 20, 5, 2, scarfLight);
  rect(12, 22, 8, 2, scarfLight);
  rect(14, 24, 5, 2, scarf);

  rect(8, 24, 3, 6, outline);
  rect(9, 24, 3, 6, fur);
  rect(21, 24, 3, 6, outline);
  rect(20, 24, 3, 6, fur);
  rect(10, 30, 12, 1, outline);
  return pixels;
}

export const usePixelStore = defineStore('pixel', () => {
  const width = ref(32);
  const height = ref(32);
  const zoom = ref(800);
  const activeTool = ref<Tool>('pencil');
  const activeColor = ref('#FF6B9D');
  const brushSize = ref(1);
  const showGrid = ref(true);
  const pixelPerfect = ref(true);
  const symmetry = ref(false);
  const cursorX = ref(0);
  const cursorY = ref(0);
  const palette = ref(defaultPalette);
  const pixels = ref<PixelValue[]>(createCatPixels(width.value, height.value));
  const history = ref<PixelValue[][]>([[...pixels.value]]);
  const historyIndex = ref(0);
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');
  const outputFormat = ref<HanddrawOutputFormat>('c-array');
  const colorMode = ref<ColorMode>('mono');
  const colorByteOrder = ref<ColorByteOrder>('big');

  function hexToRgb(hex: string): [number, number, number] {
    const value = parseInt(hex.slice(1), 16);
    return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
  }

  const bitmapOutput = computed(() => Uint8Array.from(pixels.value, (pixel) => (pixel ? 1 : 0)));

  /** Color modes: quantize drawn pixel colors directly (empty cells → black). */
  const colorBytesOutput = computed(() => {
    const mode = colorMode.value;
    if (mode === 'mono') return new Uint8Array();
    const count = pixels.value.length;
    const bpp = mode === 'rgb565' ? 2 : mode === 'rgb888' ? 3 : 1;
    const bytes = new Uint8Array(count * bpp);
    pixels.value.forEach((pixel, i) => {
      const [r, g, b] = pixel ? hexToRgb(pixel) : [0, 0, 0];
      if (mode === 'rgb565') {
        const value = rgbToRgb565(r, g, b);
        if (colorByteOrder.value === 'big') {
          bytes[i * 2] = (value >> 8) & 0xff;
          bytes[i * 2 + 1] = value & 0xff;
        } else {
          bytes[i * 2] = value & 0xff;
          bytes[i * 2 + 1] = (value >> 8) & 0xff;
        }
      } else if (mode === 'rgb888') {
        bytes[i * 3] = r;
        bytes[i * 3 + 1] = g;
        bytes[i * 3 + 2] = b;
      } else if (mode === 'rgb332') {
        bytes[i] = rgbToRgb332(r, g, b);
      } else {
        bytes[i] = findClosestPaletteColor(r, g, b, PALETTE_16_COLORS);
      }
    });
    return bytes;
  });

  const byteOutput = computed(() => colorMode.value !== 'mono'
    ? colorBytesOutput.value
    : encodeBitmap(bitmapOutput.value, width.value, height.value, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value
      }));
  const outputBaseName = computed(() => `image_${width.value}x${height.value}`);
  const cArrayOutput = computed(() => colorMode.value !== 'mono'
    ? formatColorArray(byteOutput.value, colorMode.value, {
        name: outputBaseName.value,
        width: width.value,
        height: height.value,
        byteOrder: colorByteOrder.value
      })
    : formatCArray(byteOutput.value, {
        name: outputBaseName.value,
        width: width.value,
        height: height.value
      }));
  const hexOutput = computed(() => Array.from(byteOutput.value)
    .map((byte) => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`)
    .join(', '));
  const currentOutput = computed(() => {
    if (outputFormat.value === 'hex') return hexOutput.value;
    if (outputFormat.value === 'bin') return `[binary output] ${byteOutput.value.length} bytes`;
    return cArrayOutput.value;
  });
  const outputFileName = computed(() => {
    if (outputFormat.value === 'hex') return `${outputBaseName.value}.hex.txt`;
    if (outputFormat.value === 'bin') return `${outputBaseName.value}.bin`;
    return `${outputBaseName.value}.h`;
  });

  function indexFor(x: number, y: number) {
    return y * width.value + x;
  }

  function inBounds(x: number, y: number) {
    return x >= 0 && x < width.value && y >= 0 && y < height.value;
  }

  function pixelAt(x: number, y: number) {
    if (!inBounds(x, y)) return null;
    return pixels.value[indexFor(x, y)];
  }

  function commit(nextPixels: PixelValue[]) {
    pixels.value = nextPixels;
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push([...nextPixels]);
    historyIndex.value = history.value.length - 1;
  }

  // ── Stroke batching: one history entry per drag stroke ──
  let strokeActive = false;
  let strokeChanged = false;

  function beginStroke() {
    strokeActive = true;
    strokeChanged = false;
  }

  function endStroke() {
    if (strokeActive && strokeChanged) {
      // Pixels were mutated in place during the stroke; snapshot once.
      commit([...pixels.value]);
    }
    strokeActive = false;
    strokeChanged = false;
  }

  function writePixel(nextPixels: PixelValue[], x: number, y: number, value: PixelValue) {
    if (!inBounds(x, y)) return;

    for (let dy = 0; dy < brushSize.value; dy += 1) {
      for (let dx = 0; dx < brushSize.value; dx += 1) {
        const px = x + dx;
        const py = y + dy;
        if (!inBounds(px, py)) continue;
        nextPixels[indexFor(px, py)] = value;

        if (symmetry.value) {
          const mirrorX = width.value - 1 - px;
          nextPixels[indexFor(mirrorX, py)] = value;
        }
      }
    }
  }

  function paintPixel(x: number, y: number) {
    if (!inBounds(x, y)) return;

    if (activeTool.value === 'eyedropper') {
      const picked = pixelAt(x, y);
      if (picked) activeColor.value = picked;
      return;
    }

    if (activeTool.value === 'fill') {
      commit(floodFill([...pixels.value], width.value, height.value, x, y, activeColor.value));
      return;
    }

    const value = activeTool.value === 'eraser' ? null : activeColor.value;
    if (strokeActive) {
      // Mutate in place during a stroke; endStroke() commits one history entry.
      const nextPixels = [...pixels.value];
      writePixel(nextPixels, x, y, value);
      pixels.value = nextPixels;
      strokeChanged = true;
      return;
    }

    const nextPixels = [...pixels.value];
    writePixel(nextPixels, x, y, value);
    commit(nextPixels);
  }

  function setCursor(x: number, y: number) {
    cursorX.value = x;
    cursorY.value = y;
  }

  function setTool(tool: Tool) {
    activeTool.value = tool;
  }

  function setCanvasSize(size: number) {
    if (size === width.value && size === height.value) return;
    // Preserve the overlapping region instead of wiping the drawing.
    const next = createEmptyPixels(size, size);
    const copyW = Math.min(size, width.value);
    const copyH = Math.min(size, height.value);
    for (let y = 0; y < copyH; y += 1) {
      for (let x = 0; x < copyW; x += 1) {
        next[y * size + x] = pixels.value[y * width.value + x];
      }
    }
    width.value = size;
    height.value = size;
    commit(next);
  }

  function clearCanvas() {
    commit(createEmptyPixels(width.value, height.value));
  }

  function undo() {
    if (historyIndex.value <= 0) return;
    historyIndex.value -= 1;
    pixels.value = [...history.value[historyIndex.value]];
  }

  function redo() {
    if (historyIndex.value >= history.value.length - 1) return;
    historyIndex.value += 1;
    pixels.value = [...history.value[historyIndex.value]];
  }

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  function outputBlob() {
    if (outputFormat.value === 'bin') {
      return new Blob([new Uint8Array(byteOutput.value)], { type: 'application/octet-stream' });
    }
    return makeTextBlob(currentOutput.value);
  }

  return {
    width,
    height,
    zoom,
    activeTool,
    activeColor,
    brushSize,
    showGrid,
    pixelPerfect,
    symmetry,
    cursorX,
    cursorY,
    palette,
    pixels,
    scanDirection,
    bitOrder,
    polarity,
    outputFormat,
    colorMode,
    colorByteOrder,
    bitmapOutput,
    byteOutput,
    cArrayOutput,
    hexOutput,
    currentOutput,
    outputFileName,
    canUndo,
    canRedo,
    pixelAt,
    paintPixel,
    beginStroke,
    endStroke,
    setCursor,
    setTool,
    setCanvasSize,
    clearCanvas,
    undo,
    redo,
    outputBlob
  };
});
