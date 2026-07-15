import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { fontImageDataToBitmap, makeFontIdentifier, renderTextToBitmap } from '../../../engines/fontRenderer';
import { formatCArray, makeTextBlob } from '../../../engines/outputFormatter';

export interface FontGlyph {
  char: string;
  bitmap: Uint8Array;
  bytes: Uint8Array;
}

export const useFontModuloStore = defineStore('fontModulo', () => {
  const text = ref('汉');
  const fontFamily = ref('Noto Sans CJK SC, Microsoft YaHei, SimSun, sans-serif');
  const fontSize = ref(64);
  const bold = ref(false);
  const italic = ref(false);
  const targetWidth = ref(32);
  const targetHeight = ref(32);
  const threshold = ref(128);
  const invert = ref(false);
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
    if (glyphs.value.length === 1) {
      return formatCArray(glyphs.value[0].bytes, {
        name: outputName.value,
        width: targetWidth.value,
        height: targetHeight.value
      });
    }
    // One array per character plus an index table.
    const sections = glyphs.value.map((glyph) =>
      formatCArray(glyph.bytes, {
        name: makeFontIdentifier(glyph.char, targetWidth.value, targetHeight.value),
        width: targetWidth.value,
        height: targetHeight.value
      })
    );
    const names = glyphs.value.map((glyph) =>
      makeFontIdentifier(glyph.char, targetWidth.value, targetHeight.value)
    );
    sections.push([
      `// Glyph table: "${text.value}"`,
      `const uint8_t* const ${outputName.value}_glyphs[${glyphs.value.length}] PROGMEM = {`,
      `  ${names.join(', ')}`,
      `};`,
      `const uint16_t ${outputName.value}_glyph_count = ${glyphs.value.length};`
    ].join('\n'));
    return sections.join('\n\n');
  });

  function generate() {
    const chars = Array.from(text.value || ' ');
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

  return {
    text,
    fontFamily,
    fontSize,
    bold,
    italic,
    targetWidth,
    targetHeight,
    threshold,
    invert,
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
