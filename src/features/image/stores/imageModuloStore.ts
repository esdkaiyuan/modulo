import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, type DitherMode } from '../../../engines/imageProcessor';
import { processImageDataToColor, type ColorByteOrder, type ColorMode } from '../../../engines/colorProcessor';
import { formatCArray, formatColorArray, makeHeaderFilename, makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';
import { useSizeMode } from '../../shared/useSizeMode';

export type { ColorMode } from '../../../engines/colorProcessor';

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
  const colorMode = ref<ColorMode>('mono');
  const colorByteOrder = ref<ColorByteOrder>('big');
  const previewUrl = ref('');
  const sourceImageData = ref<ImageData | null>(null);
  const sourceGray = ref<Uint8ClampedArray>(new Uint8ClampedArray());
  const bitmap = ref<Uint8Array>(new Uint8Array());
  const bytes = ref<Uint8Array>(new Uint8Array());
  /** Color modes: quantized RGBA at target size for the preview canvas. */
  const colorPreview = ref<Uint8ClampedArray>(new Uint8ClampedArray());

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
  const scalingAlgorithm = ref<'nearest' | 'bilinear'>('nearest');
  const dithering = ref<DitherMode>('floyd-steinberg');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');
  const fixedMode = ref(false);
  const previewScale = ref(2);
  const showGrid = ref(true);

  // Size mode: 'custom' (free W×H) or 'aspect' (locked to source ratio).
  const { sizeMode, aspectLongEdge, applyAspect, isAspectMatched } = useSizeMode({
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    onResize: () => {
      if (!sourceImageData.value) return;
      syncCropToTarget();
      fixedMode.value ? quickProcess() : process();
    }
  });

  const totalBits = computed(() => targetWidth.value * targetHeight.value);
  const generatedName = computed(() => sanitizeIdentifier(fileName.value || `image_${targetWidth.value}x${targetHeight.value}`));
  const generatedSource = computed(() => {
    if (colorMode.value !== 'mono') {
      return formatColorArray(bytes.value, colorMode.value, {
        name: generatedName.value,
        width: targetWidth.value,
        height: targetHeight.value,
        byteOrder: colorByteOrder.value
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

    // In aspect mode a freshly loaded image re-fits to its own ratio first.
    if (sizeMode.value === 'aspect') applyAspect();

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

  function clearOutputs() {
    bitmap.value = new Uint8Array();
    bytes.value = new Uint8Array();
    colorPreview.value = new Uint8ClampedArray();
  }

  /** Run the color pipeline on the given source region (full pipeline: resize+adjust+quantize). */
  function processColor(source: ImageData) {
    const { bytes: colorBytes, preview } = processImageDataToColor(source, {
      targetWidth: targetWidth.value,
      targetHeight: targetHeight.value,
      brightness: brightness.value,
      contrast: contrast.value,
      scalingAlgorithm: scalingAlgorithm.value,
      format: colorMode.value as Exclude<ColorMode, 'mono'>,
      byteOrder: colorByteOrder.value,
      dither: dithering.value !== 'none'
    });
    bitmap.value = new Uint8Array();
    bytes.value = colorBytes;
    colorPreview.value = preview;
  }

  function processMono(gray: Uint8ClampedArray, srcW: number, srcH: number) {
    bitmap.value = processGrayToBitmap(gray, {
      sourceWidth: srcW,
      sourceHeight: srcH,
      targetWidth: targetWidth.value,
      targetHeight: targetHeight.value,
      brightness: brightness.value,
      contrast: contrast.value,
      threshold: threshold.value,
      dither: dithering.value,
      scalingAlgorithm: scalingAlgorithm.value
    });
    bytes.value = encodeBitmap(bitmap.value, targetWidth.value, targetHeight.value, {
      scan: scanDirection.value,
      bitOrder: bitOrder.value,
      polarity: polarity.value
    });
    colorPreview.value = new Uint8ClampedArray();
  }

  function quickProcess() {
    if (!sourceImageData.value || sourceGray.value.length === 0) {
      clearOutputs();
      return;
    }
    if (colorMode.value !== 'mono') {
      processColor(sourceImageData.value);
      return;
    }
    processMono(sourceGray.value, sourceWidth.value, sourceHeight.value);
  }

  function process() {
    if (!sourceImageData.value || sourceGray.value.length === 0) {
      clearOutputs();
      return;
    }

    if (cropW.value === 0 || cropH.value === 0) {
      syncCropToTarget();
    }

    const effectiveSourceWidth = cropW.value || sourceWidth.value;
    const effectiveSourceHeight = cropH.value || sourceHeight.value;
    const effectiveSourceX = cropX.value;
    const effectiveSourceY = cropY.value;

    if (colorMode.value !== 'mono') {
      const cropped = extractImageDataCrop(sourceImageData.value, effectiveSourceX, effectiveSourceY, effectiveSourceWidth, effectiveSourceHeight);
      processColor(cropped);
      return;
    }

    const croppedGray = extractCrop(sourceGray.value, effectiveSourceX, effectiveSourceY, effectiveSourceWidth, effectiveSourceHeight, sourceWidth.value);
    processMono(croppedGray, effectiveSourceWidth, effectiveSourceHeight);
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
      result.data.set(srcData.subarray(srcOffset, srcOffset + w * 4), dstOffset);
    }
    return result;
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
    clearOutputs();
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
    colorByteOrder,
    detectedColorMode,
    previewUrl,
    sourceImageData,
    sourceGray,
    bitmap,
    bytes,
    colorPreview,
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
    sizeMode,
    aspectLongEdge,
    applyAspect,
    isAspectMatched,
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
