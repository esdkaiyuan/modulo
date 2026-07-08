import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, type DitherMode } from '../../../engines/imageProcessor';
import { makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';

export interface ExtractedVideoFrame {
  imageData: ImageData;
  time: number;
}

export interface LoadExtractedVideoFramesPayload {
  fileName: string;
  width: number;
  height: number;
  duration: number;
  objectUrl?: string;
  frames: ExtractedVideoFrame[];
}

export interface ProcessedVideoFrame {
  time: number;
  bitmap: Uint8Array;
  bytes: Uint8Array;
}

export const useVideoModuloStore = defineStore('videoModulo', () => {
  const fileName = ref('');
  const sourceWidth = ref(0);
  const sourceHeight = ref(0);
  const duration = ref(0);
  const objectUrl = ref('');
  const extractedFrames = ref<ExtractedVideoFrame[]>([]);
  const processedFrames = ref<ProcessedVideoFrame[]>([]);
  const selectedIndex = ref(0);

  const startTime = ref(0);
  const endTime = ref(0);
  const sampleFps = ref(10);
  const sampleEveryNFrames = ref(1);
  const outputFps = ref(10);
  const targetWidth = ref(128);
  const targetHeight = ref(64);
  const brightness = ref(0);
  const contrast = ref(1);
  const threshold = ref(128);
  const dithering = ref<DitherMode>('none');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');

  const selectedFrame = computed(() => processedFrames.value[selectedIndex.value] ?? processedFrames.value[0] ?? null);
  const bytesPerFrame = computed(() => Math.ceil(targetWidth.value * targetHeight.value / 8));
  const estimatedBytes = computed(() => processedFrames.value.reduce((sum, frame) => sum + frame.bytes.length, 0));
  const outputName = computed(() => `${sanitizeIdentifier(fileName.value || 'video')}_video`);

  const generatedSource = computed(() => {
    const frameCount = processedFrames.value.length;
    const lines = [
      `// Video: ${fileName.value || 'untitled'}`,
      `// Resolution: ${targetWidth.value}x${targetHeight.value}, FPS: ${outputFps.value}, Frames: ${frameCount}`,
      `const uint8_t ${outputName.value}_frames[${frameCount}][${bytesPerFrame.value}] PROGMEM = {`
    ];

    processedFrames.value.forEach((frame, index) => {
      const values = Array.from(frame.bytes)
        .map((byte) => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`)
        .join(', ');
      lines.push(`  // Frame ${index} - Time: ${frame.time.toFixed(3)}s`);
      lines.push(`  { ${values} }${index < processedFrames.value.length - 1 ? ',' : ''}`);
    });

    lines.push('};');
    lines.push(`const uint16_t ${outputName.value}_frame_count = ${frameCount};`);
    lines.push(`const uint16_t ${outputName.value}_width = ${targetWidth.value};`);
    lines.push(`const uint16_t ${outputName.value}_height = ${targetHeight.value};`);
    lines.push(`const uint16_t ${outputName.value}_fps = ${outputFps.value};`);
    return lines.join('\n');
  });

  function loadExtractedFrames(payload: LoadExtractedVideoFramesPayload) {
    fileName.value = payload.fileName;
    sourceWidth.value = payload.width;
    sourceHeight.value = payload.height;
    duration.value = payload.duration;
    objectUrl.value = payload.objectUrl ?? objectUrl.value;
    extractedFrames.value = payload.frames;
    startTime.value = payload.frames[0]?.time ?? 0;
    endTime.value = payload.duration || payload.frames[payload.frames.length - 1]?.time || 0;
    selectedIndex.value = 0;
    processFrames();
  }

  function processFrames() {
    processedFrames.value = extractedFrames.value.map((frame) => {
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
      return { time: frame.time, bitmap, bytes };
    });
    selectedIndex.value = Math.min(selectedIndex.value, Math.max(0, processedFrames.value.length - 1));
  }

  function outputBlob() {
    return makeTextBlob(generatedSource.value);
  }

  const outputFileName = computed(() => `${outputName.value}.h`);

  return {
    fileName,
    sourceWidth,
    sourceHeight,
    duration,
    objectUrl,
    extractedFrames,
    processedFrames,
    selectedIndex,
    startTime,
    endTime,
    sampleFps,
    sampleEveryNFrames,
    outputFps,
    targetWidth,
    targetHeight,
    brightness,
    contrast,
    threshold,
    dithering,
    scanDirection,
    bitOrder,
    polarity,
    selectedFrame,
    bytesPerFrame,
    estimatedBytes,
    outputName,
    generatedSource,
    outputFileName,
    loadExtractedFrames,
    processFrames,
    outputBlob
  };
});
