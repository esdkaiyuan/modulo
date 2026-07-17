import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, type DitherMode } from '../../../engines/imageProcessor';
import { COLOR_FORMAT_INFO, palette16Bytes, processImageDataToColor, type ColorByteOrder, type ColorMode } from '../../../engines/colorProcessor';
import { colorValueChunks, makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';
import { useSizeMode } from '../../shared/useSizeMode';

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
  /** Color modes: quantized RGBA at target size for previews. */
  preview?: Uint8ClampedArray;
}

// How the output frame count is derived from the selected range:
// 'step'  — keep every Nth frame (sampleStep)
// 'count' — evenly resample the range down to targetFrameCount frames
export type SamplingMode = 'step' | 'count';

export const useAnimationModuloStore = defineStore('animationModulo', () => {
  const fileName = ref('');
  const sourceWidth = ref(0);
  const sourceHeight = ref(0);
  const decodedFrames = ref<DecodedAnimationFrame[]>([]);
  const processedFrames = ref<ProcessedAnimationFrame[]>([]);
  const selectedIndex = ref(0);

  const startFrame = ref(1);
  const endFrame = ref(1);
  const samplingMode = ref<SamplingMode>('step');
  const sampleStep = ref(1);
  const targetFrameCount = ref(1);
  const targetWidth = ref(64);
  const targetHeight = ref(64);
  const brightness = ref(0);
  const contrast = ref(1);
  const threshold = ref(128);
  const dithering = ref<DitherMode>('none');
  const colorMode = ref<ColorMode>('mono');
  const colorByteOrder = ref<ColorByteOrder>('big');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');

  // Size mode: 'custom' (free W×H) or 'aspect' (locked to source ratio).
  // The settings watch below already reprocesses on target dim changes.
  const { sizeMode, aspectLongEdge, applyAspect, isAspectMatched } = useSizeMode({
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight
  });

  const selectedFrame = computed(() => processedFrames.value[selectedIndex.value] ?? processedFrames.value[0] ?? null);
  const delayTable = computed(() => processedFrames.value.map((frame) => frame.delay));
  const bytesPerFrame = computed(() => colorMode.value === 'mono'
    ? Math.ceil(targetWidth.value * targetHeight.value / 8)
    : targetWidth.value * targetHeight.value * COLOR_FORMAT_INFO[colorMode.value].bytesPerPixel
  );
  const outputName = computed(() => sanitizeIdentifier(fileName.value || 'animation_frames'));
  const totalDuration = computed(() => delayTable.value.reduce((sum, delay) => sum + delay, 0));

  const generatedSource = computed(() => {
    const frameCount = processedFrames.value.length;
    const mode = colorMode.value;
    const isColor = mode !== 'mono';
    const elementType = mode === 'rgb565' ? 'uint16_t' : 'uint8_t';
    const perFrame = mode === 'rgb565' ? bytesPerFrame.value / 2 : bytesPerFrame.value;
    const formatComment = isColor ? COLOR_FORMAT_INFO[mode].label : '1bpp';
    const lines = [
      `// Animation: ${fileName.value || 'untitled'}`,
      `// Frames: ${frameCount}, Resolution: ${targetWidth.value}x${targetHeight.value}, ${formatComment}`
    ];
    if (mode === 'palette16') {
      lines.push(`const uint16_t ${outputName.value}_palette[] PROGMEM = {`);
      lines.push(`  ${colorValueChunks(palette16Bytes(colorByteOrder.value), 'rgb565', colorByteOrder.value).join(', ')}`);
      lines.push('};', '');
    }
    lines.push(`const ${elementType} ${outputName.value}_frames[${frameCount}][${perFrame}] PROGMEM = {`);

    processedFrames.value.forEach((frame, frameIndex) => {
      const values = isColor
        ? colorValueChunks(frame.bytes, mode, colorByteOrder.value, frame.bytes.length).join(', ')
        : Array.from(frame.bytes)
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
    targetFrameCount.value = payload.frames.length;
    selectedIndex.value = 0;
    if (sizeMode.value === 'aspect') applyAspect();
    processFrames();
  }

  // Frame indices to output, derived from range + sampling settings.
  function sampleIndices(start: number, end: number): number[] {
    const rangeLength = end - start;
    if (rangeLength <= 0) return [];

    if (samplingMode.value === 'count') {
      const count = Math.min(rangeLength, Math.max(1, Math.round(targetFrameCount.value)));
      if (count === 1) return [start];
      // Evenly spread `count` picks across the range (dedupe guards rounding collisions)
      const indices = Array.from({ length: count }, (_, i) => start + Math.round(i * (rangeLength - 1) / (count - 1)));
      return [...new Set(indices)];
    }

    const step = Math.max(1, Math.round(sampleStep.value));
    const indices: number[] = [];
    for (let index = start; index < end; index += step) indices.push(index);
    return indices;
  }

  function processFrames() {
    const start = Math.max(0, startFrame.value - 1);
    const end = Math.min(decodedFrames.value.length, endFrame.value);
    const nextFrames: ProcessedAnimationFrame[] = [];

    for (const index of sampleIndices(start, end)) {
      const frame = decodedFrames.value[index];
      if (colorMode.value !== 'mono') {
        const { bytes, preview } = processImageDataToColor(frame.imageData, {
          targetWidth: targetWidth.value,
          targetHeight: targetHeight.value,
          brightness: brightness.value,
          contrast: contrast.value,
          format: colorMode.value,
          byteOrder: colorByteOrder.value,
          dither: dithering.value !== 'none'
        });
        nextFrames.push({
          sourceIndex: index + 1,
          delay: frame.delay,
          bitmap: new Uint8Array(),
          bytes,
          preview
        });
        continue;
      }
      const gray = imageDataToGray(frame.imageData);
      const bitmap = processGrayToBitmap(gray, {
        sourceWidth: frame.imageData.width,
        sourceHeight: frame.imageData.height,
        targetWidth: targetWidth.value,
        targetHeight: targetHeight.value,
        brightness: brightness.value,
        contrast: contrast.value,
        threshold: threshold.value,
        dither: dithering.value
      });
      const bytes = encodeBitmap(bitmap, targetWidth.value, targetHeight.value, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value
      });
      nextFrames.push({
        sourceIndex: index + 1,
        delay: frame.delay,
        bitmap,
        bytes
      });
    }

    processedFrames.value = nextFrames;
    selectedIndex.value = Math.min(selectedIndex.value, Math.max(0, nextFrames.length - 1));
  }

  function outputBlob() {
    return makeTextBlob(generatedSource.value);
  }

  // Auto re-process when any setting changes (debounced)
  let processTimer: ReturnType<typeof setTimeout> | null = null;
  watch(
    () => [
      startFrame.value, endFrame.value, samplingMode.value, sampleStep.value, targetFrameCount.value,
      targetWidth.value, targetHeight.value, brightness.value, contrast.value,
      threshold.value, dithering.value, colorMode.value, colorByteOrder.value,
      scanDirection.value, bitOrder.value, polarity.value
    ],
    () => {
      if (!decodedFrames.value.length) return;
      if (processTimer) clearTimeout(processTimer);
      processTimer = setTimeout(() => {
        processTimer = null;
        processFrames();
      }, 80);
    }
  );

  const outputFileName = computed(() => `${outputName.value}_animation.h`);

  return {
    fileName,
    sourceWidth,
    sourceHeight,
    decodedFrames,
    processedFrames,
    selectedIndex,
    startFrame,
    endFrame,
    samplingMode,
    sampleStep,
    targetFrameCount,
    targetWidth,
    targetHeight,
    brightness,
    contrast,
    threshold,
    dithering,
    colorMode,
    colorByteOrder,
    scanDirection,
    bitOrder,
    polarity,
    sizeMode,
    aspectLongEdge,
    applyAspect,
    isAspectMatched,
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
