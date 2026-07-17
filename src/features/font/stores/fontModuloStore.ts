import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { fontImageDataToBitmap, makeFontIdentifier, renderTextToBitmap, renderTextToImageData } from '../../../engines/fontRenderer';
import { processImageDataToColor, type ColorByteOrder, type ColorMode } from '../../../engines/colorProcessor';
import { formatCArray, formatColorArray, makeTextBlob } from '../../../engines/outputFormatter';
import type { SizeMode } from '../../shared/sizeMode';

export interface FontGlyph {
  char: string;
  bitmap: Uint8Array;
  bytes: Uint8Array;
  /** Color modes: quantized RGBA at target size for previews. */
  preview?: Uint8ClampedArray;
}

export const useFontModuloStore = defineStore('fontModulo', () => {
  const text = ref('汉');
  const fontFamily = ref('Noto Sans CJK SC, Microsoft YaHei, SimSun, sans-serif');
  const fontSize = ref(64);
  const bold = ref(false);
  const italic = ref(false);
  const targetWidth = ref(32);
  const targetHeight = ref(32);
  // Font glyphs have no source raster. 'aspect' locks a square 1:1 cell
  // (the canonical glyph box, driven by aspectLongEdge); 'custom' frees W×H.
  const sizeMode = ref<SizeMode>('custom');
  const aspectLongEdge = ref(32);
  const threshold = ref(128);
  const invert = ref(false);
  const colorMode = ref<ColorMode>('mono');
  const colorByteOrder = ref<ColorByteOrder>('big');
  const textColor = ref('#ffffff');
  const bgColor = ref('#000000');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');
  const glyphs = ref<FontGlyph[]>([]);
  const selectedGlyphIndex = ref(0);

  // Selected glyph (preview target); falls back to the first one.
  const selectedGlyph = computed(() =>
    glyphs.value[selectedGlyphIndex.value] ?? glyphs.value[0] ?? null
  );
  const bitmap = computed(() => selectedGlyph.value?.bitmap ?? new Uint8Array());
  const bytes = computed(() => selectedGlyph.value?.bytes ?? new Uint8Array());

  const totalBits = computed(() => targetWidth.value * targetHeight.value * Math.max(1, glyphs.value.length));
  const outputName = computed(() => makeFontIdentifier(text.value, targetWidth.value, targetHeight.value));

  const generatedSource = computed(() => {
    if (!glyphs.value.length) return '';
    const formatOne = (glyphBytes: Uint8Array, name: string) => colorMode.value !== 'mono'
      ? formatColorArray(glyphBytes, colorMode.value, {
          name,
          width: targetWidth.value,
          height: targetHeight.value,
          byteOrder: colorByteOrder.value
        })
      : formatCArray(glyphBytes, {
          name,
          width: targetWidth.value,
          height: targetHeight.value
        });
    if (glyphs.value.length === 1) {
      return formatOne(glyphs.value[0].bytes, outputName.value);
    }
    // One array per character plus an index table.
    const sections = glyphs.value.map((glyph) =>
      formatOne(glyph.bytes, makeFontIdentifier(glyph.char, targetWidth.value, targetHeight.value))
    );
    const names = glyphs.value.map((glyph) =>
      makeFontIdentifier(glyph.char, targetWidth.value, targetHeight.value)
    );
    const tableType = colorMode.value === 'rgb565' ? 'uint16_t' : 'uint8_t';
    sections.push([
      `// Glyph table: "${text.value}"`,
      `const ${tableType}* const ${outputName.value}_glyphs[${glyphs.value.length}] PROGMEM = {`,
      `  ${names.join(', ')}`,
      `};`,
      `const uint16_t ${outputName.value}_glyph_count = ${glyphs.value.length};`
    ].join('\n'));
    return sections.join('\n\n');
  });

  /** Color-mode glyph pipeline: render with colors → quantize. */
  function makeColorGlyph(char: string): FontGlyph {
    const imageData = renderTextToImageData({
      text: char,
      fontFamily: fontFamily.value,
      fontSize: fontSize.value,
      bold: bold.value,
      italic: italic.value,
      width: targetWidth.value,
      height: targetHeight.value,
      textColor: textColor.value,
      bgColor: bgColor.value
    });
    const { bytes: glyphBytes, preview } = processImageDataToColor(imageData, {
      targetWidth: targetWidth.value,
      targetHeight: targetHeight.value,
      brightness: 0,
      contrast: 1,
      format: colorMode.value as Exclude<ColorMode, 'mono'>,
      byteOrder: colorByteOrder.value
    });
    return { char, bitmap: new Uint8Array(), bytes: glyphBytes, preview };
  }

  function generate() {
    const chars = Array.from(text.value || ' ');
    if (colorMode.value !== 'mono') {
      glyphs.value = chars.map(makeColorGlyph);
      selectedGlyphIndex.value = Math.min(selectedGlyphIndex.value, Math.max(0, glyphs.value.length - 1));
      return;
    }
    glyphs.value = chars.map((char) => {
      const glyphBitmap = renderTextToBitmap({
        text: char,
        fontFamily: fontFamily.value,
        fontSize: fontSize.value,
        bold: bold.value,
        italic: italic.value,
        width: targetWidth.value,
        height: targetHeight.value
      }, threshold.value, invert.value);
      const glyphBytes = encodeBitmap(glyphBitmap, targetWidth.value, targetHeight.value, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value
      });
      return { char, bitmap: glyphBitmap, bytes: glyphBytes };
    });
    selectedGlyphIndex.value = Math.min(selectedGlyphIndex.value, Math.max(0, glyphs.value.length - 1));
  }

  function generateFromImageData(imageData: ImageData) {
    const glyphBitmap = fontImageDataToBitmap(imageData, threshold.value, invert.value);
    const glyphBytes = encodeBitmap(glyphBitmap, targetWidth.value, targetHeight.value, {
      scan: scanDirection.value,
      bitOrder: bitOrder.value,
      polarity: polarity.value
    });
    glyphs.value = [{ char: text.value || '?', bitmap: glyphBitmap, bytes: glyphBytes }];
    selectedGlyphIndex.value = 0;
  }

  function outputBlob() {
    return makeTextBlob(generatedSource.value);
  }

  // Auto-regenerate on any setting change (debounced).
  // Encoding-only changes could re-encode without re-rendering, but the render
  // is cheap enough that a single path keeps this simple.
  let generateTimer: ReturnType<typeof setTimeout> | null = null;
  watch(
    () => [
      text.value, fontFamily.value, fontSize.value, bold.value, italic.value,
      targetWidth.value, targetHeight.value, threshold.value, invert.value,
      colorMode.value, colorByteOrder.value, textColor.value, bgColor.value,
      scanDirection.value, bitOrder.value, polarity.value
    ],
    () => {
      if (generateTimer) clearTimeout(generateTimer);
      generateTimer = setTimeout(() => {
        generateTimer = null;
        generate();
      }, 120);
    }
  );

  const outputFileName = computed(() => `${outputName.value}.h`);

  // Aspect mode keeps the glyph cell square, sized by aspectLongEdge.
  watch([sizeMode, aspectLongEdge], () => {
    if (sizeMode.value === 'aspect') {
      const edge = Math.max(1, Math.round(aspectLongEdge.value));
      targetWidth.value = edge;
      targetHeight.value = edge;
    }
  });

  return {
    text,
    fontFamily,
    fontSize,
    bold,
    italic,
    targetWidth,
    targetHeight,
    sizeMode,
    aspectLongEdge,
    threshold,
    invert,
    colorMode,
    colorByteOrder,
    textColor,
    bgColor,
    scanDirection,
    bitOrder,
    polarity,
    glyphs,
    selectedGlyphIndex,
    selectedGlyph,
    bitmap,
    bytes,
    totalBits,
    outputName,
    generatedSource,
    outputFileName,
    generate,
    generateFromImageData,
    outputBlob
  };
});
