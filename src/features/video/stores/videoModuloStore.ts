import { defineStore } from 'pinia';
import { computed, ref, shallowRef, watch } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, type DitherMode } from '../../../engines/imageProcessor';
import { makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';
import { extractVideoFrames } from '../utils/videoFrameExtractor';
import { MAX_FILE_SIZE } from '../constants';

export interface ExtractedVideoFrame {
  imageData: ImageData;
  time: number;
}

export interface ProcessedVideoFrame {
  time: number;
  bitmap: Uint8Array;
  bytes: Uint8Array;
}

export const useVideoModuloStore = defineStore('videoModulo', () => {
  // ── Source ──────────────────────────────────────────
  const fileName = ref('');
  const sourceWidth = ref(0);
  const sourceHeight = ref(0);
  const duration = ref(0);
  const objectUrl = ref('');

  // ── Raw extracted frames (ImageData) ─────────────────
  const extractedFrames = ref<ExtractedVideoFrame[]>([]);

  // Source file kept so extraction settings can re-extract.
  const sourceFile = shallowRef<File | null>(null);
  const isExtracting = ref(false);
  const extractError = ref('');

  // ── Processed frames (bitmap + encoded bytes) ─────────
  const processedFrames = ref<ProcessedVideoFrame[]>([]);
  const selectedIndex = ref(0);
  const isPlaying = ref(false);

  // ── Extraction settings ──────────────────────────────
  const startTime = ref(0);
  const endTime = ref(0);
  const sampleFps = ref(10);
  const sampleEveryNFrames = ref(1);
  const outputFps = ref(10);

  // ── Processing settings ──────────────────────────────
  const targetWidth = ref(128);
  const targetHeight = ref(64);
  const brightness = ref(0);
  const contrast = ref(1);
  const threshold = ref(128);
  const dithering = ref<DitherMode>('none');
  const scalingAlgorithm = ref<'nearest' | 'bilinear'>('nearest');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');
  const previewScale = ref(2);

  // ── Computed ────────────────────────────────────────
  const selectedFrame = computed(() =>
    processedFrames.value[selectedIndex.value] ?? processedFrames.value[0] ?? null
  );
  const bytesPerFrame = computed(() => Math.ceil(targetWidth.value * targetHeight.value / 8));
  const estimatedBytes = computed(() =>
    processedFrames.value.reduce((sum, f) => sum + f.bytes.length, 0)
  );
  const outputName = computed(() => `${sanitizeIdentifier(fileName.value || 'video')}_video`);
  const totalFrames = computed(() => processedFrames.value.length);
  const hasFrames = computed(() => processedFrames.value.length > 0);

  const generatedSource = computed(() => {
    const frameCount = processedFrames.value.length;
    const lines = [
      `// Video: ${fileName.value || 'untitled'}`,
      `// Resolution: ${targetWidth.value}x${targetHeight.value}, FPS: ${outputFps.value}, Frames: ${frameCount}`,
      `const uint8_t ${outputName.value}_frames[${frameCount}][${bytesPerFrame.value}] PROGMEM = {`
    ];
    processedFrames.value.forEach((frame, index) => {
      const values = Array.from(frame.bytes)
        .map((b) => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`)
        .join(', ');
      lines.push(`  // Frame ${index} - Time: ${frame.time.toFixed(3)}s`);
      lines.push(`  { ${values} }${index < frameCount - 1 ? ',' : ''}`);
    });
    lines.push('};');
    lines.push(`const uint16_t ${outputName.value}_frame_count = ${frameCount};`);
    lines.push(`const uint16_t ${outputName.value}_width = ${targetWidth.value};`);
    lines.push(`const uint16_t ${outputName.value}_height = ${targetHeight.value};`);
    lines.push(`const uint16_t ${outputName.value}_fps = ${outputFps.value};`);
    return lines.join('\n');
  });

  // ── Processing ──────────────────────────────────────
  let processTimer: ReturnType<typeof setTimeout> | null = null;

  function processAll() {
    if (!extractedFrames.value.length) return;
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
        dither: dithering.value,
        scalingAlgorithm: scalingAlgorithm.value,
      });
      const bytes = encodeBitmap(bitmap, targetWidth.value, targetHeight.value, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value,
      });
      return { time: frame.time, bitmap, bytes };
    });
    selectedIndex.value = Math.min(selectedIndex.value, Math.max(0, processedFrames.value.length - 1));
  }

  function outputBlob() {
    return makeTextBlob(generatedSource.value);
  }

  function scheduleProcess() {
    if (processTimer) clearTimeout(processTimer);
    processTimer = setTimeout(() => {
      processTimer = null;
      processAll();
    }, 80);
  }

  // ── Load video ──────────────────────────────────────
  function loadVideo(payload: {
    fileName: string;
    width: number;
    height: number;
    duration: number;
    objectUrl?: string;
    frames: ExtractedVideoFrame[];
  }) {
    // Revoke previous source URL before replacing it.
    if (objectUrl.value && objectUrl.value !== payload.objectUrl) {
      URL.revokeObjectURL(objectUrl.value);
    }
    fileName.value = payload.fileName;
    sourceWidth.value = payload.width;
    sourceHeight.value = payload.height;
    duration.value = payload.duration;
    objectUrl.value = payload.objectUrl ?? '';
    extractedFrames.value = payload.frames;
    startTime.value = payload.frames[0]?.time ?? 0;
    endTime.value = payload.duration || payload.frames[payload.frames.length - 1]?.time || 0;
    selectedIndex.value = 0;
    isPlaying.value = false;
    processAll();
  }

  /** Full pipeline: validate file → extract frames (start/end/sampleFps) → process. */
  async function loadVideoFile(file: File): Promise<boolean> {
    if (file.size > MAX_FILE_SIZE) {
      extractError.value = `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`;
      return false;
    }
    extractError.value = '';
    isExtracting.value = true;
    pause();
    try {
      const result = await extractVideoFrames({
        file,
        startTime: 0,
        endTime: 0, // 0 → full duration
        sampleFps: sampleFps.value,
        everyNFrames: sampleEveryNFrames.value
      });
      sourceFile.value = file;
      loadVideo(result);
      return true;
    } catch (error) {
      extractError.value = error instanceof Error ? error.message : 'Video failed to load';
      return false;
    } finally {
      isExtracting.value = false;
    }
  }

  /** Re-extract from the kept source file using current start/end/sampleFps. */
  async function reExtract(): Promise<boolean> {
    const file = sourceFile.value;
    if (!file) {
      // No source retained (e.g. legacy load path) — just reprocess what we have.
      processAll();
      return extractedFrames.value.length > 0;
    }
    extractError.value = '';
    isExtracting.value = true;
    pause();
    try {
      const result = await extractVideoFrames({
        file,
        startTime: startTime.value,
        endTime: endTime.value,
        sampleFps: sampleFps.value,
        everyNFrames: sampleEveryNFrames.value
      });
      const keepStart = startTime.value;
      const keepEnd = endTime.value;
      loadVideo(result);
      startTime.value = keepStart;
      endTime.value = keepEnd || result.duration;
      return true;
    } catch (error) {
      extractError.value = error instanceof Error ? error.message : 'Frame extraction failed';
      return false;
    } finally {
      isExtracting.value = false;
    }
  }

  // ── Playback ────────────────────────────────────────
  let playTimer: number | null = null;

  function play() {
    if (isPlaying.value) return;
    isPlaying.value = true;
    const interval = 1000 / outputFps.value;
    playTimer = window.setInterval(() => {
      if (selectedIndex.value >= processedFrames.value.length - 1) {
        selectedIndex.value = 0;
      } else {
        selectedIndex.value++;
      }
    }, interval);
  }

  function pause() {
    isPlaying.value = false;
    if (playTimer !== null) {
      clearInterval(playTimer);
      playTimer = null;
    }
  }

  function togglePlay() {
    isPlaying.value ? pause() : play();
  }

  watch(() => isPlaying.value, (playing) => {
    if (!playing && playTimer !== null) {
      clearInterval(playTimer);
      playTimer = null;
    }
  });

  // ── Auto re-process on settings change (debounced) ──
  watch(
    () => [
      targetWidth.value, targetHeight.value, brightness.value, contrast.value,
      threshold.value, dithering.value, scalingAlgorithm.value,
      scanDirection.value, bitOrder.value, polarity.value, outputFps.value,
    ],
    () => {
      if (!isPlaying.value) scheduleProcess();
    }
  );

  const outputFileName = computed(() => `${outputName.value}.h`);
  function cleanup() {
    pause();
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = '';
    sourceFile.value = null;
    extractError.value = '';
    extractedFrames.value = [];
    processedFrames.value = [];
    selectedIndex.value = 0;
    fileName.value = '';
    sourceWidth.value = 0;
    sourceHeight.value = 0;
    duration.value = 0;
  }

  return {
    // source
    fileName, sourceWidth, sourceHeight, duration, objectUrl,
    sourceFile, isExtracting, extractError,
    // raw
    extractedFrames,
    // processed
    processedFrames, selectedIndex, isPlaying, selectedFrame,
    // settings
    startTime, endTime, sampleFps, sampleEveryNFrames, outputFps,
    targetWidth, targetHeight, brightness, contrast, threshold,
    dithering, scalingAlgorithm, scanDirection, bitOrder, polarity, previewScale,
    // computed
    bytesPerFrame, estimatedBytes, outputName, totalFrames, hasFrames, generatedSource,
    outputFileName,
    // methods
    loadVideo, loadVideoFile, reExtract, processAll, scheduleProcess,
    // backward-compatible aliases
    loadExtractedFrames(payload: Parameters<typeof loadVideo>[0]) { loadVideo(payload); },
    processFrames: processAll,
    outputBlob,
    play, pause, togglePlay, cleanup,
  };
});
