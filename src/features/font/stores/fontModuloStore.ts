import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { fontImageDataToBitmap, makeFontIdentifier, renderTextToBitmap } from '../../../engines/fontRenderer';
import { formatCArray, makeTextBlob } from '../../../engines/outputFormatter';

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
  const bitmap = ref<Uint8Array>(new Uint8Array());
  const bytes = ref<Uint8Array>(new Uint8Array());

  const totalBits = computed(() => targetWidth.value * targetHeight.value);
  const outputName = computed(() => makeFontIdentifier(text.value, targetWidth.value, targetHeight.value));
  const generatedSource = computed(() => formatCArray(bytes.value, {
    name: outputName.value,
    width: targetWidth.value,
    height: targetHeight.value
  }));

  function encodeCurrentBitmap() {
    bytes.value = encodeBitmap(bitmap.value, targetWidth.value, targetHeight.value, {
      scan: scanDirection.value,
      bitOrder: bitOrder.value,
      polarity: polarity.value
    });
  }

  function generate() {
    bitmap.value = renderTextToBitmap({
      text: text.value,
      fontFamily: fontFamily.value,
      fontSize: fontSize.value,
      bold: bold.value,
      italic: italic.value,
      width: targetWidth.value,
      height: targetHeight.value
    }, threshold.value, invert.value);
    encodeCurrentBitmap();
  }

  function generateFromImageData(imageData: ImageData) {
    bitmap.value = fontImageDataToBitmap(imageData, threshold.value, invert.value);
    encodeCurrentBitmap();
  }

  function outputBlob() {
    return makeTextBlob(generatedSource.value);
  }

  const outputFileName = computed(() => `${outputName.value}.h`);

  generateFromImageData(new ImageData(new Uint8ClampedArray(targetWidth.value * targetHeight.value * 4), targetWidth.value, targetHeight.value));

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
