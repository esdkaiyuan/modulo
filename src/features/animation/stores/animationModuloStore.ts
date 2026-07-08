import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, type DitherMode } from '../../../engines/imageProcessor';
import { makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';

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

  const selectedFrame = computed(() => processedFrames.value[selectedIndex.value] ?? processedFrames.value[0] ?? null);
  const delayTable = computed(() => processedFrames.value.map((frame) => frame.delay));
  const bytesPerFrame = computed(() => Math.ceil(targetWidth.value * targetHeight.value / 8));
  const outputName = computed(() => sanitizeIdentifier(fileName.value || 'animation_frames'));
  const totalDuration = computed(() => delayTable.value.reduce((sum, delay) => sum + delay, 0));

  const generatedSource = computed(() => {
    const frameCount = processedFrames.value.length;
    const lines = [
      `// Animation: ${fileName.value || 'untitled'}`,
      `// Frames: ${frameCount}, Resolution: ${targetWidth.value}x${targetHeight.value}, 1bpp`,
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
    const nextFrames: ProcessedAnimationFrame[] = [];

    for (let index = start; index < end; index += step) {
      const frame = decodedFrames.value[index];
      const gray = imageDataToGray(frame.imageData);
      const bitmap = processGrayToBitmap(gray, {
        sourceWidth: frame.imageData.width,
        sourceHeight: frame.imageData.height,
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
    sampleStep,
    targetWidth,
    targetHeight,
    threshold,
    dithering,
    scanDirection,
    bitOrder,
    polarity,
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
