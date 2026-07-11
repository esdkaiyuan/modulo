import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import {
  createPalette16,
  decodePalette16,
  decodeRgb565,
  decodeRgb888,
  encodePalette16,
  encodeRgb565,
  encodeRgb888
} from '../../../engines/colorEncoder';
import { formatModuloC, formatModuloHex, makeModuloBlob, makeModuloFileName } from '../../../engines/exportFormatter';
import { imageDataToGray, processGrayToBitmap, processImageData, type DitherMode } from '../../../engines/imageProcessor';
import type {
  EncodedModuloResult,
  ExportFormat,
  ModuloMode,
  Rgb565ByteOrder,
  Rgb888Order
} from '../../shared/moduloTypes';
import { sanitizeIdentifier } from '../../../engines/outputFormatter';

export interface LoadedImagePayload {
  fileName: string;
  width: number;
  height: number;
  size: number;
  type: string;
  imageData: ImageData;
  dataUrl?: string;
}

function blankImageData(width = 1, height = 1): ImageData {
  return new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
}

function monoPreview(bitmap: Uint8Array, width: number, height: number): ImageData {
  const preview = blankImageData(width, height);
  bitmap.forEach((bit, index) => {
    const value = bit ? 255 : 0;
    preview.data.set([value, value, value, 255], index * 4);
  });
  return preview;
}

function emptyResult(): EncodedModuloResult {
  return { mode: 'mono', width: 0, height: 0, bytes: new Uint8Array(), paletteBytes: new Uint8Array(), previewImageData: blankImageData() };
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
  const processedImageData = ref<ImageData | null>(null);
  const bitmap = ref<Uint8Array>(new Uint8Array());
  const bytes = ref<Uint8Array>(new Uint8Array());
  const result = ref<EncodedModuloResult>(emptyResult());

  const targetWidth = ref(128);
  const targetHeight = ref(64);
  const cropX = ref(0);
  const cropY = ref(0);
  const cropWidth = ref(0);
  const cropHeight = ref(0);
  const brightness = ref(0);
  const contrast = ref(1);
  const threshold = ref(128);
  const scalingAlgorithm = ref<'nearest' | 'bilinear'>('nearest');
  const dithering = ref<DitherMode>('floyd-steinberg');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');
  const mode = ref<ModuloMode>('mono');
  const exportFormat = ref<ExportFormat>('c-array');
  const rgb565ByteOrder = ref<Rgb565ByteOrder>('msb-first');
  const rgb888Order = ref<Rgb888Order>('rgb');
  const transparentBackground = ref('#FFFFFF');

  const bitsPerPixel = computed(() => mode.value === 'mono' ? 1 : mode.value === 'rgb565' ? 16 : mode.value === 'rgb888' ? 24 : 4);
  const totalBits = computed(() => targetWidth.value * targetHeight.value * bitsPerPixel.value);
  const generatedName = computed(() => sanitizeIdentifier(fileName.value || `image_${targetWidth.value}x${targetHeight.value}`));
  const generatedSource = computed(() => exportFormat.value === 'c-array'
    ? formatModuloC(result.value, { name: generatedName.value })
    : formatModuloHex(result.value));
  const outputFileName = computed(() => makeModuloFileName(fileName.value || generatedName.value, exportFormat.value));

  function loadImageData(payload: LoadedImagePayload) {
    fileName.value = payload.fileName;
    sourceWidth.value = payload.width;
    sourceHeight.value = payload.height;
    fileSize.value = payload.size;
    fileType.value = payload.type;
    previewUrl.value = payload.dataUrl ?? '';
    sourceImageData.value = payload.imageData;
    sourceGray.value = imageDataToGray(payload.imageData);
    setCropRegion(0, 0, payload.width, payload.height);
    process();
  }

  function setCropRegion(x: number, y: number, width: number, height: number) {
    if (!sourceWidth.value || !sourceHeight.value) return;
    cropX.value = Math.max(0, Math.min(Math.floor(x), sourceWidth.value - 1));
    cropY.value = Math.max(0, Math.min(Math.floor(y), sourceHeight.value - 1));
    cropWidth.value = Math.max(1, Math.min(Math.floor(width), sourceWidth.value - cropX.value));
    cropHeight.value = Math.max(1, Math.min(Math.floor(height), sourceHeight.value - cropY.value));
  }

  function process() {
    if (!sourceImageData.value) {
      bitmap.value = new Uint8Array();
      bytes.value = new Uint8Array();
      result.value = emptyResult();
      return;
    }

    const processed = processImageData(sourceImageData.value, {
      cropX: cropX.value,
      cropY: cropY.value,
      cropWidth: cropWidth.value || sourceWidth.value,
      cropHeight: cropHeight.value || sourceHeight.value,
      targetWidth: targetWidth.value,
      targetHeight: targetHeight.value,
      brightness: brightness.value,
      contrast: contrast.value,
      scalingAlgorithm: scalingAlgorithm.value
    });
    processedImageData.value = processed;

    if (mode.value === 'mono') {
      bitmap.value = processGrayToBitmap(imageDataToGray(processed), {
        sourceWidth: processed.width,
        sourceHeight: processed.height,
        targetWidth: processed.width,
        targetHeight: processed.height,
        brightness: 0,
        contrast: 1,
        threshold: threshold.value,
        dither: dithering.value
      });
      bytes.value = encodeBitmap(bitmap.value, processed.width, processed.height, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value
      });
      result.value = { mode: 'mono', width: processed.width, height: processed.height, bytes: bytes.value, paletteBytes: new Uint8Array(), previewImageData: monoPreview(bitmap.value, processed.width, processed.height) };
      return;
    }

    bitmap.value = new Uint8Array();
    if (mode.value === 'rgb565') {
      bytes.value = encodeRgb565(processed, { scan: scanDirection.value }, rgb565ByteOrder.value, transparentBackground.value);
      result.value = { mode: 'rgb565', width: processed.width, height: processed.height, bytes: bytes.value, paletteBytes: new Uint8Array(), previewImageData: decodeRgb565(bytes.value, processed.width, processed.height, { scan: scanDirection.value }, rgb565ByteOrder.value) };
    } else if (mode.value === 'rgb888') {
      bytes.value = encodeRgb888(processed, { scan: scanDirection.value }, rgb888Order.value, transparentBackground.value);
      result.value = { mode: 'rgb888', width: processed.width, height: processed.height, bytes: bytes.value, paletteBytes: new Uint8Array(), previewImageData: decodeRgb888(bytes.value, processed.width, processed.height, { scan: scanDirection.value }, rgb888Order.value) };
    } else {
      const palette = createPalette16([processed], transparentBackground.value);
      const encoded = encodePalette16(processed, { scan: scanDirection.value }, palette, transparentBackground.value);
      bytes.value = encoded.pixelBytes;
      result.value = { mode: 'palette16', width: processed.width, height: processed.height, bytes: encoded.pixelBytes, paletteBytes: encoded.paletteBytes, previewImageData: decodePalette16(encoded.pixelBytes, encoded.paletteBytes, processed.width, processed.height, { scan: scanDirection.value }) };
    }
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
    processedImageData.value = null;
    bitmap.value = new Uint8Array();
    bytes.value = new Uint8Array();
    result.value = emptyResult();
  }

  function outputBlob() {
    return makeModuloBlob(result.value, exportFormat.value, { name: generatedName.value });
  }

  return {
    fileName, sourceWidth, sourceHeight, fileSize, fileType, previewUrl, sourceImageData, sourceGray,
    processedImageData, bitmap, bytes, result, targetWidth, targetHeight, cropX, cropY, cropWidth,
    cropHeight, brightness, contrast, threshold, scalingAlgorithm, dithering, scanDirection, bitOrder,
    polarity, mode, exportFormat, rgb565ByteOrder, rgb888Order, transparentBackground, totalBits,
    bitsPerPixel, generatedName, generatedSource, outputFileName, loadImageData, setCropRegion, process,
    reset, outputBlob
  };
});
