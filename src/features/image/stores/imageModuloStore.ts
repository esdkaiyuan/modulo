import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, type DitherMode } from '../../../engines/imageProcessor';
import { formatCArray, makeHeaderFilename, makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';

export interface LoadedImagePayload {
  fileName: string;
  width: number;
  height: number;
  size: number;
  type: string;
  imageData: ImageData;
  dataUrl?: string;
}

export const useImageModuloStore = defineStore('imageModulo', () => {
  const fileName = ref('');
  const sourceWidth = ref(0);
  const sourceHeight = ref(0);
  const fileSize = ref(0);
  const fileType = ref('');
  const previewUrl = ref('');
  const sourceImageData = ref<ImageData | null>(null);
  const sourceGray = ref<Uint8ClampedArray>(new Uint8ClampedArray());
  const bitmap = ref<Uint8Array>(new Uint8Array());
  const bytes = ref<Uint8Array>(new Uint8Array());

  const targetWidth = ref(128);
  const targetHeight = ref(64);
  const brightness = ref(0);
  const contrast = ref(1);
  const threshold = ref(128);
  const scalingAlgorithm = ref('nearest');
  const dithering = ref<DitherMode>('floyd-steinberg');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');

  const totalBits = computed(() => targetWidth.value * targetHeight.value);
  const generatedName = computed(() => sanitizeIdentifier(fileName.value || `image_${targetWidth.value}x${targetHeight.value}`));
  const generatedSource = computed(() => formatCArray(bytes.value, {
    name: generatedName.value,
    width: targetWidth.value,
    height: targetHeight.value
  }));

  function loadImageData(payload: LoadedImagePayload) {
    fileName.value = payload.fileName;
    sourceWidth.value = payload.width;
    sourceHeight.value = payload.height;
    fileSize.value = payload.size;
    fileType.value = payload.type;
    previewUrl.value = payload.dataUrl ?? '';
    sourceImageData.value = payload.imageData;
    sourceGray.value = imageDataToGray(payload.imageData);
    process();
  }

  function process() {
    if (!sourceImageData.value || sourceGray.value.length === 0) {
      bitmap.value = new Uint8Array();
      bytes.value = new Uint8Array();
      return;
    }

    bitmap.value = processGrayToBitmap(sourceGray.value, {
      sourceWidth: sourceWidth.value,
      sourceHeight: sourceHeight.value,
      targetWidth: targetWidth.value,
      targetHeight: targetHeight.value,
      brightness: brightness.value,
      contrast: contrast.value,
      threshold: threshold.value,
      dither: dithering.value
    });

    bytes.value = encodeBitmap(bitmap.value, targetWidth.value, targetHeight.value, {
      scan: scanDirection.value,
      bitOrder: bitOrder.value,
      polarity: polarity.value
    });
  }

  function reset() {
    fileName.value = '';
    sourceWidth.value = 0;
    sourceHeight.value = 0;
    fileSize.value = 0;
    fileType.value = '';
    previewUrl.value = '';
    sourceImageData.value = null;
    sourceGray.value = new Uint8ClampedArray();
    bitmap.value = new Uint8Array();
    bytes.value = new Uint8Array();
  }

  function outputBlob() {
    return makeTextBlob(generatedSource.value);
  }

  const outputFileName = computed(() => makeHeaderFilename(fileName.value || generatedName.value));

  return {
    fileName,
    sourceWidth,
    sourceHeight,
    fileSize,
    fileType,
    previewUrl,
    sourceImageData,
    sourceGray,
    bitmap,
    bytes,
    targetWidth,
    targetHeight,
    brightness,
    contrast,
    threshold,
    scalingAlgorithm,
    dithering,
    scanDirection,
    bitOrder,
    polarity,
    totalBits,
    generatedName,
    generatedSource,
    outputFileName,
    loadImageData,
    process,
    reset,
    outputBlob
  };
});
