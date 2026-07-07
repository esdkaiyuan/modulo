import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { floodFill } from '../engines/fill';
import { packBitsToBytes, pixelsToBits, pixelsToCArray, type PixelValue } from '../engines/modulo';

export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper';

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
  const pixels = ref<PixelValue[]>(createEmptyPixels(width.value, height.value));
  const history = ref<PixelValue[][]>([[...pixels.value]]);
  const historyIndex = ref(0);

  const byteOutput = computed(() => packBitsToBytes(pixelsToBits(pixels.value)));
  const cArrayOutput = computed(() => pixelsToCArray(pixels.value, width.value, height.value));

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

    const nextPixels = [...pixels.value];

    if (activeTool.value === 'fill') {
      commit(floodFill(nextPixels, width.value, height.value, x, y, activeColor.value));
      return;
    }

    writePixel(nextPixels, x, y, activeTool.value === 'eraser' ? null : activeColor.value);
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
    width.value = size;
    height.value = size;
    pixels.value = createEmptyPixels(size, size);
    history.value = [[...pixels.value]];
    historyIndex.value = 0;
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
    byteOutput,
    cArrayOutput,
    pixelAt,
    paintPixel,
    setCursor,
    setTool,
    setCanvasSize,
    undo,
    redo
  };
});
