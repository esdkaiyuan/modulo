import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, type DitherMode, quantizeToRgb565, quantizeToPalette16, PALETTE_16_COLORS } from '../../../engines/imageProcessor';
import { formatCArray, formatRgb565Array, formatPalette16Array, makeHeaderFilename, makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';

export type ColorMode = 'mono' | 'rgb565' | 'palette16';

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
  const colorMode = ref<'mono' | 'rgb565' | 'palette16'>('mono');
  const previewUrl = ref('');
  const sourceImageData = ref<ImageData | null>(null);
  const sourceGray = ref<Uint8ClampedArray>(new Uint8ClampedArray());
  const bitmap = ref<Uint8Array>(new Uint8Array());
  const bytes = ref<Uint8Array>(new Uint8Array());
  const colorData = ref<Uint8Array>(new Uint8Array());
  const paletteBytes = ref<Uint8Array>(new Uint8Array());
  const paletteIndex = ref<Uint8Array>(new Uint8Array());

  const targetWidth = ref(128);
  const targetHeight = ref(64);
  const cropX = ref(0);
  const cropY = ref(0);
  const cropW = ref(0);
  const cropH = ref(0);
  const detectedColorMode = ref('');
  const brightness = ref(0);
  const contrast = ref(1);
  const threshold = ref(128);
  const scalingAlgorithm = ref('nearest');
  const dithering = ref<DitherMode>('floyd-steinberg');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');
  const fixedMode = ref(false);
  const previewScale = ref(2);
  const showGrid = ref(true);

  const totalBits = computed(() => targetWidth.value * targetHeight.value);
  const generatedName = computed(() => sanitizeIdentifier(fileName.value || `image_${targetWidth.value}x${targetHeight.value}`));
  const generatedSource = computed(() => {
    if (colorMode.value === 'rgb565') {
      return formatRgb565Array(bytes.value, {
        name: generatedName.value,
        width: targetWidth.value,
        height: targetHeight.value
      });
    }
    if (colorMode.value === 'palette16') {
      return formatPalette16Array(paletteBytes.value, paletteIndex.value, {
        name: generatedName.value,
        width: targetWidth.value,
        height: targetHeight.value
      });
    }
    return formatCArray(bytes.value, {
      name: generatedName.value,
      width: targetWidth.value,
      height: targetHeight.value
    });
  });

  function loadImageData(payload: LoadedImagePayload) {
    fileName.value = payload.fileName;
    sourceWidth.value = payload.width;
    sourceHeight.value = payload.height;
    fileSize.value = payload.size;
    fileType.value = payload.type;
    detectedColorMode.value = detectColorMode(payload.imageData);
    previewUrl.value = payload.dataUrl ?? '';
    sourceImageData.value = payload.imageData;
    sourceGray.value = imageDataToGray(payload.imageData);

    if (fixedMode.value) {
      quickProcess();
    } else {
      process();
    }
  }

  function syncCropToTarget() {
    if (!sourceWidth.value || !sourceHeight.value) return;
    const sourceAspect = sourceWidth.value / sourceHeight.value;

    let cw: number, ch: number;
    if (sourceAspect > 1) {
      ch = targetHeight.value;
      cw = Math.round(ch * sourceAspect);
    } else {
      cw = targetWidth.value;
      ch = Math.round(cw / sourceAspect);
    }

    cw = Math.max(1, Math.min(cw, sourceWidth.value));
    ch = Math.max(1, Math.min(ch, sourceHeight.value));
    cropW.value = cw;
    cropH.value = ch;
  }

  function setCropRegion(x: number, y: number, w: number, h: number) {
    cropX.value = Math.max(0, Math.min(x, sourceWidth.value - w));
    cropY.value = Math.max(0, Math.min(y, sourceHeight.value - h));
    cropW.value = Math.max(1, Math.min(w, sourceWidth.value));
    cropH.value = Math.max(1, Math.min(h, sourceHeight.value));
  }

  function detectColorMode(imageData: ImageData): string {
    const data = imageData.data;
    let hasColor = false;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r !== g || g !== b) {
        hasColor = true;
        break;
      }
    }
    return hasColor ? 'RGB Color' : 'Grayscale';
  }

  function quickProcess() {
    if (!sourceImageData.value || sourceGray.value.length === 0) {
      bitmap.value = new Uint8Array();
      bytes.value = new Uint8Array();
      colorData.value = new Uint8Array();
      paletteBytes.value = new Uint8Array();
      paletteIndex.value = new Uint8Array();
      return;
    }

    const tw = targetWidth.value;
    const th = targetHeight.value;

    bitmap.value = processGrayToBitmap(sourceGray.value, {
      sourceWidth: sourceWidth.value,
      sourceHeight: sourceHeight.value,
      targetWidth: tw,
      targetHeight: th,
      brightness: brightness.value,
      contrast: contrast.value,
      threshold: threshold.value,
      dither: dithering.value
    });

    bytes.value = encodeBitmap(bitmap.value, tw, th, {
      scan: scanDirection.value,
      bitOrder: bitOrder.value,
      polarity: polarity.value
    });

    if (colorMode.value === 'rgb565') {
      const rgb565 = quantizeToRgb565(sourceImageData.value);
      colorData.value = new Uint8Array(rgb565.buffer);
      paletteBytes.value = new Uint8Array();
      paletteIndex.value = new Uint8Array();
    } else if (colorMode.value === 'palette16') {
      paletteIndex.value = quantizeToPalette16(sourceImageData.value);
      paletteBytes.value = new Uint8Array(PALETTE_16_COLORS.length * 2);
      for (let i = 0; i < PALETTE_16_COLORS.length; i++) {
        const rgb565 = rgbToRgb565(PALETTE_16_COLORS[i][0], PALETTE_16_COLORS[i][1], PALETTE_16_COLORS[i][2]);
        paletteBytes.value[i * 2] = (rgb565 >> 8) & 0xFF;
        paletteBytes.value[i * 2 + 1] = rgb565 & 0xFF;
      }
      colorData.value = new Uint8Array();
    } else {
      colorData.value = new Uint8Array();
      paletteBytes.value = new Uint8Array();
      paletteIndex.value = new Uint8Array();
    }
  }

  function process() {
    if (!sourceImageData.value || sourceGray.value.length === 0) {
      bitmap.value = new Uint8Array();
      bytes.value = new Uint8Array();
      colorData.value = new Uint8Array();
      paletteBytes.value = new Uint8Array();
      paletteIndex.value = new Uint8Array();
      return;
    }

    if (cropW.value === 0 || cropH.value === 0) {
      syncCropToTarget();
    }

    const effectiveSourceWidth = cropW.value || sourceWidth.value;
    const effectiveSourceHeight = cropH.value || sourceHeight.value;
    const effectiveSourceX = cropX.value;
    const effectiveSourceY = cropY.value;

    const croppedGray = extractCrop(sourceGray.value, effectiveSourceX, effectiveSourceY, effectiveSourceWidth, effectiveSourceHeight, sourceWidth.value);

    bitmap.value = processGrayToBitmap(croppedGray, {
      sourceWidth: effectiveSourceWidth,
      sourceHeight: effectiveSourceHeight,
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

    if (colorMode.value === 'rgb565') {
      const rgb565 = quantizeToRgb565(sourceImageData.value);
      colorData.value = new Uint8Array(rgb565.buffer);
      paletteBytes.value = new Uint8Array();
      paletteIndex.value = new Uint8Array();
    } else if (colorMode.value === 'palette16') {
      const fullPaletteIndex = quantizeToPalette16(sourceImageData.value);
      paletteIndex.value = fullPaletteIndex;
      paletteBytes.value = new Uint8Array(PALETTE_16_COLORS.length * 2);
      for (let i = 0; i < PALETTE_16_COLORS.length; i++) {
        const rgb565 = rgbToRgb565(PALETTE_16_COLORS[i][0], PALETTE_16_COLORS[i][1], PALETTE_16_COLORS[i][2]);
        paletteBytes.value[i * 2] = (rgb565 >> 8) & 0xFF;
        paletteBytes.value[i * 2 + 1] = rgb565 & 0xFF;
      }
      colorData.value = new Uint8Array();
    } else {
      colorData.value = new Uint8Array();
      paletteBytes.value = new Uint8Array();
      paletteIndex.value = new Uint8Array();
    }
  }

  function extractCrop(gray: Uint8ClampedArray, x: number, y: number, w: number, h: number, stride: number): Uint8ClampedArray {
    const result = new Uint8ClampedArray(w * h);
    for (let row = 0; row < h; row++) {
      const srcOffset = (y + row) * stride + x;
      const dstOffset = row * w;
      result.set(gray.subarray(srcOffset, srcOffset + w), dstOffset);
    }
    return result;
  }

  function extractImageDataCrop(imageData: ImageData, x: number, y: number, w: number, h: number): ImageData {
    const result = new ImageData(w, h);
    const srcData = imageData.data;
    const srcStride = imageData.width;
    for (let row = 0; row < h; row++) {
      const srcOffset = ((y + row) * srcStride + x) * 4;
      const dstOffset = row * w * 4;
      for (let col = 0; col < w; col++) {
        const si = srcOffset + col * 4;
        const di = dstOffset + col * 4;
        result.data[di] = srcData[si];
        result.data[di + 1] = srcData[si + 1];
        result.data[di + 2] = srcData[si + 2];
        result.data[di + 3] = srcData[si + 3];
      }
    }
    return result;
  }

  function rgbToRgb565(r: number, g: number, b: number): number {
    return ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
  }

  function reset() {
    fileName.value = '';
    sourceWidth.value = 0;
    sourceHeight.value = 0;
    fileSize.value = 0;
    fileType.value = '';
    detectedColorMode.value = '';
    previewUrl.value = '';
    sourceImageData.value = null;
    sourceGray.value = new Uint8ClampedArray();
    bitmap.value = new Uint8Array();
    bytes.value = new Uint8Array();
    colorData.value = new Uint8Array();
    paletteBytes.value = new Uint8Array();
    paletteIndex.value = new Uint8Array();
    cropX.value = 0;
    cropY.value = 0;
    cropW.value = 0;
    cropH.value = 0;
  }

  function outputBlob() {
    return makeTextBlob(generatedSource.value);
  }

  const outputFileName = computed(() => makeHeaderFilename(fileName.value || generatedName.value));

  watch(() => fixedMode.value, () => {
    if (!sourceImageData.value) return;
    if (fixedMode.value) {
      quickProcess();
    } else {
      syncCropToTarget();
      process();
    }
  });

  return {
    fileName,
    sourceWidth,
    sourceHeight,
    fileSize,
    fileType,
    colorMode,
    detectedColorMode,
    previewUrl,
    sourceImageData,
    sourceGray,
    bitmap,
    bytes,
    colorData,
    paletteBytes,
    paletteIndex,
    targetWidth,
    targetHeight,
    cropX,
    cropY,
    cropW,
    cropH,
    brightness,
    contrast,
    threshold,
    scalingAlgorithm,
    dithering,
    scanDirection,
    bitOrder,
    polarity,
    fixedMode,
    totalBits,
    generatedName,
    generatedSource,
    outputFileName,
    previewScale,
    showGrid,
    loadImageData,
    process,
    quickProcess,
    reset,
    outputBlob,
    syncCropToTarget,
    setCropRegion
  };
});
