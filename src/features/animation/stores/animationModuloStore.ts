import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, processImageData, type DitherMode } from '../../../engines/imageProcessor';
import { createPalette16, encodeColorImage } from '../../../engines/colorEncoder';
import { makeModuloFileName } from '../../../engines/exportFormatter';
import { makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';
import type { EncodedModuloResult, ExportFormat, ModuloMode, Rgb565ByteOrder, Rgb888Order } from '../../shared/moduloTypes';

export interface DecodedAnimationFrame {
  imageData: ImageData;
  delay: number;
}

export interface LoadDecodedFramesPayload {
  fileName: string;
  width: number;
  height: number;
  frames: DecodedAnimationFrame[];
}

export interface ProcessedAnimationFrame {
  sourceIndex: number;
  delay: number;
  bitmap: Uint8Array;
  bytes: Uint8Array;
  result: EncodedModuloResult;
}

export const useAnimationModuloStore = defineStore('animationModulo', () => {
  const fileName = ref('');
  const sourceWidth = ref(0);
  const sourceHeight = ref(0);
  const decodedFrames = ref<DecodedAnimationFrame[]>([]);
  const processedFrames = ref<ProcessedAnimationFrame[]>([]);
  const selectedIndex = ref(0);

  const startFrame = ref(1);
  const endFrame = ref(1);
  const sampleStep = ref(1);
  const targetWidth = ref(64);
  const targetHeight = ref(64);
  const threshold = ref(128);
  const dithering = ref<DitherMode>('none');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');
  const mode = ref<ModuloMode>('mono');
  const exportFormat = ref<ExportFormat>('c-array');
  const rgb565ByteOrder = ref<Rgb565ByteOrder>('msb-first');
  const rgb888Order = ref<Rgb888Order>('rgb');
  const transparentBackground = ref('#FFFFFF');

  const selectedFrame = computed(() => processedFrames.value[selectedIndex.value] ?? processedFrames.value[0] ?? null);
  const delayTable = computed(() => processedFrames.value.map((frame) => frame.delay));
  const bytesPerFrame = computed(() => processedFrames.value[0]?.bytes.length ?? Math.ceil(targetWidth.value * targetHeight.value / 8));
  const outputName = computed(() => sanitizeIdentifier(fileName.value || 'animation_frames'));
  const totalDuration = computed(() => delayTable.value.reduce((sum, delay) => sum + delay, 0));

  const generatedSource = computed(() => {
    const frameCount = processedFrames.value.length;
    const lines = [
      `// Animation: ${fileName.value || 'untitled'}`,
      `// Frames: ${frameCount}, Resolution: ${targetWidth.value}x${targetHeight.value}, ${mode.value}`,
      `const uint8_t ${outputName.value}_frames[${frameCount}][${bytesPerFrame.value}] PROGMEM = {`
    ];

    processedFrames.value.forEach((frame, frameIndex) => {
      const values = Array.from(frame.bytes)
        .map((byte) => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`)
        .join(', ');
      lines.push(`  // Frame ${frameIndex} (source ${frame.sourceIndex})`);
      lines.push(`  { ${values} }${frameIndex < processedFrames.value.length - 1 ? ',' : ''}`);
    });

    lines.push('};');
    lines.push('');
    lines.push(`const uint16_t ${outputName.value}_delays[${frameCount}] PROGMEM = {`);
    lines.push(`  ${delayTable.value.join(', ')}`);
    lines.push('};');
    lines.push(`const uint16_t ${outputName.value}_frame_count = ${frameCount};`);
    lines.push(`const uint16_t ${outputName.value}_width = ${targetWidth.value};`);
    lines.push(`const uint16_t ${outputName.value}_height = ${targetHeight.value};`);

    return lines.join('\n');
  });

  function loadDecodedFrames(payload: LoadDecodedFramesPayload) {
    fileName.value = payload.fileName;
    sourceWidth.value = payload.width;
    sourceHeight.value = payload.height;
    decodedFrames.value = payload.frames;
    startFrame.value = payload.frames.length > 0 ? 1 : 0;
    endFrame.value = payload.frames.length;
    selectedIndex.value = 0;
    processFrames();
  }

  function processFrames() {
    const start = Math.max(0, startFrame.value - 1);
    const end = Math.min(decodedFrames.value.length, endFrame.value);
    const step = Math.max(1, sampleStep.value);
    const selected = [] as Array<{ index: number; delay: number; imageData: ImageData }>;

    for (let index = start; index < end; index += step) {
      const frame = decodedFrames.value[index];
      selected.push({ index, delay: frame.delay, imageData: processImageData(frame.imageData, {
        cropX: 0, cropY: 0, cropWidth: frame.imageData.width, cropHeight: frame.imageData.height,
        targetWidth: targetWidth.value, targetHeight: targetHeight.value, brightness: 0, contrast: 1,
        scalingAlgorithm: 'nearest'
      }) });
    }
    const sharedPalette = mode.value === 'palette16'
      ? createPalette16(selected.map((frame) => frame.imageData), transparentBackground.value)
      : undefined;
    const nextFrames: ProcessedAnimationFrame[] = selected.map((frame) => {
      const gray = imageDataToGray(frame.imageData);
      const bitmap = processGrayToBitmap(gray, {
        sourceWidth: targetWidth.value,
        sourceHeight: targetHeight.value,
        targetWidth: targetWidth.value,
        targetHeight: targetHeight.value,
        brightness: 0,
        contrast: 1,
        threshold: threshold.value,
        dither: dithering.value
      });
      const bytes = encodeBitmap(bitmap, targetWidth.value, targetHeight.value, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value
      });
      const result = mode.value === 'mono'
        ? { mode: 'mono' as const, width: targetWidth.value, height: targetHeight.value, bytes, paletteBytes: new Uint8Array(), previewImageData: frame.imageData }
        : encodeColorImage(frame.imageData, mode.value, { scan: scanDirection.value, rgb565ByteOrder: rgb565ByteOrder.value, rgb888Order: rgb888Order.value, background: transparentBackground.value, palette: sharedPalette });
      return { sourceIndex: frame.index + 1, delay: frame.delay, bitmap, bytes: result.bytes, result };
    });

    processedFrames.value = nextFrames;
    selectedIndex.value = Math.min(selectedIndex.value, Math.max(0, nextFrames.length - 1));
  }

  function outputBlob() {
    if (exportFormat.value === 'c-array') return makeTextBlob(generatedSource.value);
    const chunks: Uint8Array[] = [];
    if (mode.value === 'palette16' && processedFrames.value[0]) chunks.push(processedFrames.value[0].result.paletteBytes);
    chunks.push(...processedFrames.value.map((frame) => frame.result.bytes));
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const bytes = new Uint8Array(length);
    let offset = 0;
    chunks.forEach((chunk) => { bytes.set(chunk, offset); offset += chunk.length; });
    if (exportFormat.value === 'bin') return new Blob([bytes], { type: 'application/octet-stream' });
    const text = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    return makeTextBlob(text);
  }

  const outputFileName = computed(() => makeModuloFileName(`${outputName.value}_animation`, exportFormat.value));

  return {
    fileName,
    sourceWidth,
    sourceHeight,
    decodedFrames,
    processedFrames,
    selectedIndex,
    startFrame,
    endFrame,
    sampleStep,
    targetWidth,
    targetHeight,
    threshold,
    dithering,
    scanDirection,
    bitOrder,
    polarity,
    mode,
    exportFormat,
    rgb565ByteOrder,
    rgb888Order,
    transparentBackground,
    selectedFrame,
    delayTable,
    bytesPerFrame,
    outputName,
    totalDuration,
    generatedSource,
    outputFileName,
    loadDecodedFrames,
    processFrames,
    outputBlob
  };
});
