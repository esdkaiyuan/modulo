import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { encodeColorImage } from '../../../engines/colorEncoder';
import { formatModuloC, formatModuloHex, makeModuloBlob, makeModuloFileName } from '../../../engines/exportFormatter';
import { colorizeFontImageData, fontImageDataToBitmap, makeFontIdentifier, renderTextToImageData } from '../../../engines/fontRenderer';
import type { EncodedModuloResult, ExportFormat, ModuloMode, Rgb565ByteOrder, Rgb888Order } from '../../shared/moduloTypes';

function blank(width: number, height: number) { return new ImageData(new Uint8ClampedArray(width * height * 4), width, height); }

export const useFontModuloStore = defineStore('fontModulo', () => {
  const text = ref('汉'); const fontFamily = ref('Noto Sans CJK SC, Microsoft YaHei, SimSun, sans-serif'); const fontSize = ref(64); const bold = ref(false); const italic = ref(false);
  const targetWidth = ref(32); const targetHeight = ref(32); const threshold = ref(128); const invert = ref(false); const scanDirection = ref<ScanDirection>('horizontal-ltr'); const bitOrder = ref<BitOrder>('msb'); const polarity = ref<Polarity>('positive');
  const bitmap = ref<Uint8Array>(new Uint8Array()); const bytes = ref<Uint8Array>(new Uint8Array());
  const mode = ref<ModuloMode>('mono'); const exportFormat = ref<ExportFormat>('c-array'); const rgb565ByteOrder = ref<Rgb565ByteOrder>('msb-first'); const rgb888Order = ref<Rgb888Order>('rgb');
  const foregroundColor = ref('#000000'); const backgroundColor = ref('#FFFFFF'); const transparentBackground = ref(false); const transparentPixelColor = ref('#FFFFFF');
  const result = ref<EncodedModuloResult>({ mode: 'mono', width: 0, height: 0, bytes: new Uint8Array(), paletteBytes: new Uint8Array(), previewImageData: blank(1, 1) });

  const totalBits = computed(() => targetWidth.value * targetHeight.value * (mode.value === 'mono' ? 1 : mode.value === 'rgb565' ? 16 : mode.value === 'rgb888' ? 24 : 4));
  const outputName = computed(() => makeFontIdentifier(text.value, targetWidth.value, targetHeight.value));
  const generatedSource = computed(() => exportFormat.value === 'c-array' ? formatModuloC(result.value, { name: outputName.value }) : formatModuloHex(result.value));
  const outputFileName = computed(() => makeModuloFileName(outputName.value, exportFormat.value));

  function generate() {
    generateFromImageData(renderTextToImageData({ text: text.value, fontFamily: fontFamily.value, fontSize: fontSize.value, bold: bold.value, italic: italic.value, width: targetWidth.value, height: targetHeight.value }));
  }
  function generateFromImageData(imageData: ImageData) {
    bitmap.value = fontImageDataToBitmap(imageData, threshold.value, invert.value);
    const monoBytes = encodeBitmap(bitmap.value, imageData.width, imageData.height, { scan: scanDirection.value, bitOrder: bitOrder.value, polarity: polarity.value });
    if (mode.value === 'mono') {
      bytes.value = monoBytes;
      result.value = { mode: 'mono', width: imageData.width, height: imageData.height, bytes: monoBytes, paletteBytes: new Uint8Array(), previewImageData: imageData };
    } else {
      const colored = colorizeFontImageData(imageData, foregroundColor.value, backgroundColor.value, transparentBackground.value);
      result.value = encodeColorImage(colored, mode.value, { scan: scanDirection.value, rgb565ByteOrder: rgb565ByteOrder.value, rgb888Order: rgb888Order.value, background: transparentPixelColor.value });
      bytes.value = result.value.bytes;
    }
  }
  function outputBlob() { return makeModuloBlob(result.value, exportFormat.value, { name: outputName.value }); }

  generateFromImageData(blank(targetWidth.value, targetHeight.value));
  return { text, fontFamily, fontSize, bold, italic, targetWidth, targetHeight, threshold, invert, scanDirection, bitOrder, polarity, bitmap, bytes, mode, exportFormat, rgb565ByteOrder, rgb888Order, foregroundColor, backgroundColor, transparentBackground, transparentPixelColor, result, totalBits, outputName, generatedSource, outputFileName, generate, generateFromImageData, outputBlob };
});
