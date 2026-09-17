import { defineStore } from 'pinia';
import { computed, ref, shallowRef, watch } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import type { DitherMode } from '../../../engines/imageProcessor';
import { COLOR_FORMAT_INFO, palette16Bytes, type ColorByteOrder, type ColorMode } from '../../../engines/colorProcessor';
import { colorValueChunks, makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';
import { extractVideoFrames } from '../utils/videoFrameExtractor';
import { MAX_FILE_SIZE, MAX_FRAMES } from '../constants';
import { useSizeMode } from '../../shared/useSizeMode';
import { getFrameProcessorPool } from '../../../workers/frameProcessorPool';
import { decodeAudioFile, resampleToMono, quantizeSamples, waveformEnvelope, type AudioBitDepth, type AudioByteOrder } from '../../../engines/audioProcessor';

export interface ExtractedVideoFrame {
  imageData: ImageData;
  time: number;
}

export interface ProcessedVideoFrame {
  time: number;
  bitmap: Uint8Array;
  bytes: Uint8Array;
  /** Color modes: quantized RGBA at target size for previews. */
  preview?: Uint8ClampedArray;
}

export const useVideoModuloStore = defineStore('videoModulo', () => {
  // ── Source ──────────────────────────────────────────
  const fileName = ref('');
  const sourceWidth = ref(0);
  const sourceHeight = ref(0);
  const duration = ref(0);
  const objectUrl = ref('');

  // ── Raw extracted frames (ImageData) ─────────────────
  const extractedFrames = shallowRef<ExtractedVideoFrame[]>([]);

  // Source file kept so extraction settings can re-extract.
  const sourceFile = shallowRef<File | null>(null);
  const isExtracting = ref(false);
  const extractError = ref('');
  const extractProgress = ref(0); // 0..1 during extraction

  // ── Processed frames (bitmap + encoded bytes) ─────────
  const processedFrames = ref<ProcessedVideoFrame[]>([]);
  const selectedIndex = ref(0);
  const isPlaying = ref(false);

  // ── Extraction settings ──────────────────────────────
  const startTime = ref(0);
  const endTime = ref(0);
  const sampleFps = ref(10);
  // Time base for sampleFps: 'second' → N fps, 'minute' → N frames per minute
  const sampleUnit = ref<'second' | 'minute'>('second');
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
  const colorMode = ref<ColorMode>('mono');
  const colorByteOrder = ref<ColorByteOrder>('big');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');
  const previewScale = ref(2);

  // ── Audio extraction state ──────────────────────────────
  const decodedAudioBuffer = shallowRef<AudioBuffer | null>(null);
  const audioSampleRate = ref(8000);
  const audioBitDepth = ref<AudioBitDepth>(8);
  const audioByteOrder = ref<AudioByteOrder>('little');
  const audioNormalize = ref(true);
  const audioGain = ref(1);
  const audioSamples = shallowRef<Float32Array>(new Float32Array());
  const audioBytes = shallowRef<Uint8Array>(new Uint8Array());
  const audioPeak = ref(0);
  const isProcessingAudio = ref(false);
  /** Include quantized PCM C arrays in the code panel (default on with video+audio). */
  const audioPcmInOutput = ref(true);
  type AudioVisualMode = 'waveform' | 'spectrum' | 'both';
  const audioVisualMode = ref<AudioVisualMode>('both');

  // ── Audio waveform pixel化 (取模) ──
  const audioWaveformWidth = ref(256);
  const audioWaveformHeight = ref(64);
  const audioWaveformMono = shallowRef<Float32Array | null>(null);
  const audioWaveformBitmap = shallowRef<Uint8Array | null>(null);
  const audioWaveformPreview = shallowRef<Uint8ClampedArray | null>(null);
  const audioSpectrumBitmap = shallowRef<Uint8Array | null>(null);
  const audioSpectrumPreview = shallowRef<Uint8ClampedArray | null>(null);

  // ── Computed ────────────────────────────────────────
  const selectedFrame = computed(() =>
    processedFrames.value[selectedIndex.value] ?? processedFrames.value[0] ?? null
  );
  const bytesPerFrame = computed(() => colorMode.value === 'mono'
    ? Math.ceil(targetWidth.value * targetHeight.value / 8)
    : targetWidth.value * targetHeight.value * COLOR_FORMAT_INFO[colorMode.value].bytesPerPixel
  );
  const estimatedBytes = computed(() => {
    const frameBytes = processedFrames.value.reduce((sum, f) => sum + f.bytes.length, 0);
    const pcmBytes = audioPcmInOutput.value ? audioBytes.value.length : 0;
    return frameBytes + pcmBytes;
  });
  const outputName = computed(() => `${sanitizeIdentifier(fileName.value || 'video')}_video`);
  const totalFrames = computed(() => processedFrames.value.length);
  const hasFrames = computed(() => processedFrames.value.length > 0);
  const audioModEnabled = ref(false);
  const audioPlaying = ref(false);
  const audioPlayTime = ref(0);
  let audioPlayEl: HTMLAudioElement | null = null;
  let audioPlayUrl = '';

  const hasAudio = computed(() => !!decodedAudioBuffer.value);
  const hasAudioWaveform = computed(() => !!audioWaveformBitmap.value);
  const audioSampleCount = computed(() => audioSamples.value.length);
  const audioDuration = computed(() => audioSampleCount.value / audioSampleRate.value);

  const videoFramesSource = computed(() => {
    const frameCount = processedFrames.value.length;
    const mode = colorMode.value;
    const isColor = mode !== 'mono';
    const elementType = mode === 'rgb565' ? 'uint16_t' : 'uint8_t';
    const perFrame = mode === 'rgb565' ? bytesPerFrame.value / 2 : bytesPerFrame.value;
    const formatComment = isColor ? COLOR_FORMAT_INFO[mode].label : '1bpp mono';
    const lines = [
      `// Video: ${fileName.value || 'untitled'}`,
      `// Resolution: ${targetWidth.value}x${targetHeight.value}, ${formatComment}, FPS: ${outputFps.value}, Frames: ${frameCount}`
    ];
    if (mode === 'palette16') {
      lines.push(`const uint16_t ${outputName.value}_palette[] PROGMEM = {`);
      lines.push(`  ${colorValueChunks(palette16Bytes(colorByteOrder.value), 'rgb565', colorByteOrder.value).join(', ')}`);
      lines.push('};', '');
    }
    lines.push(`const ${elementType} ${outputName.value}_frames[${frameCount}][${perFrame}] PROGMEM = {`);
    processedFrames.value.forEach((frame, index) => {
      const values = isColor
        ? colorValueChunks(frame.bytes, mode, colorByteOrder.value, frame.bytes.length).join(', ')
        : Array.from(frame.bytes)
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

  const audioFramesSource = computed(() => {
    const lines: string[] = [];

    // ── Audio PCM (same shape as the standalone audio tool) ──
    if (audioPcmInOutput.value && audioBytes.value.length > 0) {
      const audioName = `${outputName.value}_audio`;
      const sampleCount = audioSamples.value.length;
      lines.push('');
      lines.push(`// Audio PCM: ${sampleCount} samples, ${audioSampleRate.value} Hz, mono`);
      lines.push(
        audioBitDepth.value === 8
          ? '// Format: 8-bit unsigned (0x80 = silence)'
          : `// Format: 16-bit signed, ${audioByteOrder.value}-endian`
      );
      lines.push(`// Duration: ${(sampleCount / audioSampleRate.value).toFixed(3)} s`);
      if (audioBitDepth.value === 8) {
        lines.push(`const uint8_t ${audioName}[] PROGMEM = {`);
        const data = audioBytes.value;
        for (let i = 0; i < data.length; i += 16) {
          const chunk = Array.from(data.slice(i, i + 16), (b) => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`);
          lines.push(`  ${chunk.join(', ')}${i + 16 < data.length ? ',' : ''}`);
        }
      } else {
        lines.push(`const int16_t ${audioName}[] PROGMEM = {`);
        const data = audioBytes.value;
        const words: string[] = [];
        for (let i = 0; i + 1 < data.length; i += 2) {
          const raw = audioByteOrder.value === 'little' ? data[i] | (data[i + 1] << 8) : (data[i] << 8) | data[i + 1];
          words.push(String(raw > 32767 ? raw - 65536 : raw));
        }
        for (let i = 0; i < words.length; i += 12) {
          lines.push(`  ${words.slice(i, i + 12).join(', ')}${i + 12 < words.length ? ',' : ''}`);
        }
      }
      lines.push('};');
      lines.push(`const uint32_t ${audioName}_len = ${sampleCount};`);
      lines.push(`const uint32_t ${audioName}_rate = ${audioSampleRate.value};`);
    }

    // ── Audio waveform bitmap (pixel-mod) ──
    const wfBitmap = audioWaveformBitmap.value;
    if ((audioVisualMode.value === 'waveform' || audioVisualMode.value === 'both') && wfBitmap && wfBitmap.length > 0) {
      const wfW = audioWaveformWidth.value;
      const wfH = audioWaveformHeight.value;
      const wfBytes = encodeBitmap(wfBitmap, wfW, wfH, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value
      });
      const wfName = `${outputName.value}_audio_waveform`;
      lines.push('');
      lines.push(`// Audio Waveform: ${wfW}×${wfH} (1bpp pixel-mod)`);
      lines.push(`const uint8_t ${wfName}[] PROGMEM = {`);
      for (let i = 0; i < wfBytes.length; i += 16) {
        const chunk = Array.from(wfBytes.slice(i, i + 16), (b) => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`);
        lines.push(`  ${chunk.join(', ')}${i + 16 < wfBytes.length ? ',' : ''}`);
      }
      lines.push('};');
      lines.push(`const uint16_t ${wfName}_width = ${wfW};`);
      lines.push(`const uint16_t ${wfName}_height = ${wfH};`);
    }

    // ── Audio spectrum bitmap (pixel-mod) ──
    const spBitmap = audioSpectrumBitmap.value;
    if ((audioVisualMode.value === 'spectrum' || audioVisualMode.value === 'both') && spBitmap && spBitmap.length > 0) {
      const spW = audioWaveformWidth.value;
      const spH = audioWaveformHeight.value;
      const spBytes = encodeBitmap(spBitmap, spW, spH, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value
      });
      const spName = `${outputName.value}_audio_spectrum`;
      lines.push('');
      lines.push(`// Audio Spectrum: ${spW}×${spH} (1bpp pixel-mod)`);
      lines.push(`const uint8_t ${spName}[] PROGMEM = {`);
      for (let i = 0; i < spBytes.length; i += 16) {
        const chunk = Array.from(spBytes.slice(i, i + 16), (b) => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`);
        lines.push(`  ${chunk.join(', ')}${i + 16 < spBytes.length ? ',' : ''}`);
      }
      lines.push('};');
      lines.push(`const uint16_t ${spName}_width = ${spW};`);
      lines.push(`const uint16_t ${spName}_height = ${spH};`);
    }

    return lines.join('\n');
  });

  const generatedSource = computed(() => {
    if (!hasFrames.value) return '';
    const videoPart = videoFramesSource.value;
    if (!audioModEnabled.value) return videoPart;
    const audioPart = audioFramesSource.value;
    return audioPart ? `${videoPart}\n${audioPart}` : videoPart;
  });

  /** Decode → visualize → quantize PCM for the current time window. */
  async function syncAudioFromVideo() {
    const buffer = decodedAudioBuffer.value;
    if (!buffer) {
      audioModEnabled.value = false;
      audioSamples.value = new Float32Array();
      audioBytes.value = new Uint8Array();
      audioPeak.value = 0;
      audioWaveformBitmap.value = null;
      audioWaveformPreview.value = null;
      audioSpectrumBitmap.value = null;
      audioSpectrumPreview.value = null;
      return;
    }
    audioModEnabled.value = true;
    generateAudioVisuals();
    await processAudio();
  }

  // ── Processing ──────────────────────────────────────
  let processTimer: ReturnType<typeof setTimeout> | null = null;
  const isProcessing = ref(false);

  let processCancelToken = { cancelled: false };
  let processBusy = false;
  /** Set when a run is requested while another is still winding down. */
  let processQueued = false;

  async function processAll() {
    if (!extractedFrames.value.length) return;
    if (processBusy) {
      // The frames changed while a run is in flight (new file / re-extract):
      // remember the request instead of dropping it, otherwise the output
      // stays on the previous video's frames.
      processQueued = true;
      return;
    }
    processBusy = true;
    isProcessing.value = true;
    processCancelToken.cancelled = false;
    const cancelToken = processCancelToken;

    const pool = getFrameProcessorPool();
    const concurrency = pool.concurrency || 2;
    const frames = extractedFrames.value;
    const total = frames.length;
    const results: any[] = new Array(total);
    let cursor = 0;
    let finished = 0;

    try {
      // Process in a worker-sized sliding window to avoid flooding the queue
      // and to keep the main thread responsive.
      await new Promise<void>((resolve, reject) => {
        let activeCount = 0;
        function pump() {
          if (cancelToken.cancelled) {
            reject(new Error('cancelled'));
            return;
          }
          while (cursor < total && activeCount < concurrency * 2) {
            const idx = cursor++;
            activeCount++;
            pool.process({
              imageData: frames[idx].imageData,
              targetWidth: targetWidth.value,
              targetHeight: targetHeight.value,
              brightness: brightness.value,
              contrast: contrast.value,
              threshold: threshold.value,
              dither: dithering.value,
              scalingAlgorithm: scalingAlgorithm.value,
              scan: scanDirection.value,
              bitOrder: bitOrder.value,
              polarity: polarity.value,
              colorMode: colorMode.value,
              colorByteOrder: colorByteOrder.value,
            }).then((r: any) => {
              results[idx] = r;
              finished++;
              activeCount--;
              if (finished >= total) {
                resolve();
              } else {
                pump();
              }
            }).catch((err: Error) => {
              reject(err);
            });
          }
        }
        pump();
      });

      if (cancelToken.cancelled) return;

      processedFrames.value = results.map((r: any, i: number) => ({
        time: frames[i].time,
        bitmap: r.bitmap,
        bytes: r.bytes,
        preview: r.preview,
      }));
      selectedIndex.value = Math.min(selectedIndex.value, Math.max(0, processedFrames.value.length - 1));
    } catch (e: any) {
      if (e?.message !== 'cancelled') {
        console.error('Frame processing failed:', e);
      }
    } finally {
      isProcessing.value = false;
      processBusy = false;
      if (processQueued) {
        processQueued = false;
        scheduleProcess();
      }
    }
  }

  // ── Audio playback ──────────────────────────────────
  function ensureAudioElement() {
    if (audioPlayEl && audioPlayUrl === objectUrl.value) return audioPlayEl;
    if (audioPlayEl) {
      audioPlayEl.pause();
      audioPlayEl = null;
      audioPlayUrl = '';
    }
    if (!objectUrl.value) return null;
    audioPlayUrl = objectUrl.value;
    audioPlayEl = new Audio(audioPlayUrl);
    audioPlayEl.addEventListener('timeupdate', () => {
      audioPlayTime.value = audioPlayEl!.currentTime;
    });
    audioPlayEl.addEventListener('ended', () => {
      audioPlaying.value = false;
      audioPlayTime.value = 0;
    });
    audioPlayEl.addEventListener('play', () => { audioPlaying.value = true; });
    audioPlayEl.addEventListener('pause', () => { audioPlaying.value = false; });
    return audioPlayEl;
  }

  function toggleAudioPlay() {
    const el = ensureAudioElement();
    if (!el) return;
    if (el.paused) {
      el.currentTime = startTime.value;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }

  function seekAudio(time: number) {
    const el = ensureAudioElement();
    if (!el) return;
    el.currentTime = Math.max(startTime.value, Math.min(endTime.value, time));
  }

  // ── Audio processing ──────────────────────────────────
  async function processAudio() {
    const buffer = decodedAudioBuffer.value;
    if (!buffer) return;
    isProcessingAudio.value = true;
    try {
      const mono = await resampleToMono(buffer, audioSampleRate.value, startTime.value, endTime.value);
      const result = quantizeSamples(mono, {
        bitDepth: audioBitDepth.value,
        byteOrder: audioByteOrder.value,
        gain: audioGain.value,
        normalize: audioNormalize.value
      });
      audioSamples.value = mono;
      audioBytes.value = result.bytes;
      audioPeak.value = result.peak;
    } finally {
      isProcessingAudio.value = false;
    }
  }

  /**
   * Fast audio visualization generation — reads directly from decoded AudioBuffer
   * with stride sampling, no OfflineAudioContext resampling needed.
   * Returns almost instantly even for long videos.
   */
  function generateAudioVisuals() {
    const buffer = decodedAudioBuffer.value;
    if (!buffer) return;

    // Use first channel, downsample via stride to w buckets
    const w = audioWaveformWidth.value;
    const h = audioWaveformHeight.value;
    const channelData = buffer.getChannelData(0);
    const totalSamples = channelData.length;
    const startSample = Math.max(0, Math.floor(startTime.value * buffer.sampleRate));
    const endSample = Math.min(totalSamples, Math.floor(endTime.value * buffer.sampleRate));
    const rangeSamples = Math.max(1, endSample - startSample);
    const samplesPerBucket = Math.max(1, Math.floor(rangeSamples / w));

    // Waveform bitmap
    const bitmap = new Uint8Array(w * h);
    const preview = new Uint8ClampedArray(w * h * 4);
    const mid = Math.floor(h / 2);

    for (let x = 0; x < w; x++) {
      const bStart = startSample + x * samplesPerBucket;
      const bEnd = Math.min(endSample, bStart + samplesPerBucket);
      let minVal = 0, maxVal = 0;
      // Strided min/max sampling — fast enough for 10M+ samples
      const stride = Math.max(1, Math.floor(samplesPerBucket / 200));
      for (let i = bStart; i < bEnd; i += stride) {
        const s = channelData[i];
        if (s < minVal) minVal = s;
        if (s > maxVal) maxVal = s;
      }
      const top = Math.max(0, Math.min(h - 1, mid - Math.round(maxVal * (mid - 1))));
      const bottom = Math.max(0, Math.min(h - 1, mid - Math.round(minVal * (mid - 1))));
      for (let y = top; y <= bottom; y++) {
        bitmap[y * w + x] = 1;
        const pi = (y * w + x) * 4;
        preview[pi] = 80;
        preview[pi + 1] = 170;
        preview[pi + 2] = 255;
        preview[pi + 3] = 255;
      }
      // Center line
      bitmap[mid * w + x] = 1;
      const pi = (mid * w + x) * 4;
      preview[pi] = 200;
      preview[pi + 1] = 200;
      preview[pi + 2] = 200;
      preview[pi + 3] = 120;
    }

    audioWaveformBitmap.value = bitmap;
    audioWaveformPreview.value = preview;

    // RMS bar spectrum (amplitude over time, not frequency — but visually similar and fast)
    const specBitmap = new Uint8Array(w * h);
    const specPreview = new Uint8ClampedArray(w * h * 4);
    const bars = new Array(w).fill(0);
    const stride2 = Math.max(1, Math.floor(samplesPerBucket / 100));
    let maxBar = 0;

    for (let x = 0; x < w; x++) {
      const bStart = startSample + x * samplesPerBucket;
      const bEnd = Math.min(endSample, bStart + samplesPerBucket);
      let rms = 0;
      let count = 0;
      for (let i = bStart; i < bEnd; i += stride2) {
        const s = channelData[i] ?? 0;
        rms += s * s;
        count++;
      }
      const val = count > 0 ? Math.sqrt(rms / count) : 0;
      bars[x] = val;
      if (val > maxBar) maxBar = val;
    }
    if (maxBar > 0) {
      for (let i = 0; i < w; i++) bars[i] /= maxBar;
    }

    // Draw gradient bars
    for (let x = 0; x < w; x++) {
      const barHeight = Math.round(bars[x] * (h - 1));
      for (let y = 0; y < barHeight; y++) {
        const py = h - 1 - y;
        specBitmap[py * w + x] = 1;
        const pi = (py * w + x) * 4;
        const t = y / (h - 1);
        if (t < 0.5) {
          specPreview[pi] = Math.round(80 + t * 2 * (255 - 80));
          specPreview[pi + 1] = 220;
          specPreview[pi + 2] = 80;
        } else {
          specPreview[pi] = 255;
          specPreview[pi + 1] = Math.round(220 - (t - 0.5) * 2 * 180);
          specPreview[pi + 2] = 60;
        }
        specPreview[pi + 3] = 255;
      }
    }

    audioSpectrumBitmap.value = specBitmap;
    audioSpectrumPreview.value = specPreview;
  }

  /** Generate pixel-art waveform from audio samples (uses envelope for speed). */
  function generateAudioWaveformBitmap(samples: Float32Array) {
    const w = audioWaveformWidth.value;
    const h = audioWaveformHeight.value;
    const bitmap = new Uint8Array(w * h);
    const preview = new Uint8ClampedArray(w * h * 4);

    // First compute envelope: w pairs of [min, max] — O(N) total but very tight loop
    const envelope = waveformEnvelope(samples, w);
    const mid = Math.floor(h / 2);

    for (let x = 0; x < w; x++) {
      const minVal = envelope[x * 2];
      const maxVal = envelope[x * 2 + 1];
      const top = Math.max(0, Math.min(h - 1, mid - Math.round(maxVal * (mid - 1))));
      const bottom = Math.max(0, Math.min(h - 1, mid - Math.round(minVal * (mid - 1))));
      for (let y = top; y <= bottom; y++) {
        bitmap[y * w + x] = 1;
        const pi = (y * w + x) * 4;
        preview[pi] = 80;
        preview[pi + 1] = 170;
        preview[pi + 2] = 255;
        preview[pi + 3] = 255;
      }
      // Center line
      bitmap[mid * w + x] = 1;
      const pi = (mid * w + x) * 4;
      preview[pi] = 200;
      preview[pi + 1] = 200;
      preview[pi + 2] = 200;
      preview[pi + 3] = 120;
    }

    audioWaveformBitmap.value = bitmap;
    audioWaveformPreview.value = preview;
  }

  /** Generate pixel-art amplitude bars from audio samples (time-domain RMS per window). */
  function generateAudioSpectrumBitmap(samples: Float32Array, sampleRate: number) {
    const w = audioWaveformWidth.value;
    const h = audioWaveformHeight.value;
    const bitmap = new Uint8Array(w * h);
    const preview = new Uint8ClampedArray(w * h * 4);

    // Compute RMS per window using the envelope (fast O(N) pass already done for waveform,
    // but we redo it here for simplicity — still very fast with stride sampling)
    const windowSize = Math.max(1, Math.floor(samples.length / w));
    const bars = new Array(w).fill(0);
    // Strided RMS: sample only every Nth sample for speed (still accurate enough for visualization)
    const stride = Math.max(1, Math.floor(windowSize / 200));
    for (let x = 0; x < w; x++) {
      const start = x * windowSize;
      let rms = 0;
      let count = 0;
      for (let i = 0; i < windowSize; i += stride) {
        const s = samples[start + i] ?? 0;
        rms += s * s;
        count++;
      }
      bars[x] = count > 0 ? Math.sqrt(rms / count) : 0;
    }

    // Normalize
    let maxBar = 0;
    for (let i = 0; i < w; i++) if (bars[i] > maxBar) maxBar = bars[i];
    if (maxBar > 0) {
      for (let i = 0; i < w; i++) bars[i] /= maxBar;
    }

    // Draw bars from bottom up
    for (let x = 0; x < w; x++) {
      const barHeight = Math.round(bars[x] * (h - 1));
      for (let y = 0; y < barHeight; y++) {
        const py = h - 1 - y;
        bitmap[py * w + x] = 1;
        const pi = (py * w + x) * 4;
        // Gradient: green → yellow → red
        const t = y / (h - 1);
        if (t < 0.5) {
          preview[pi] = Math.round(80 + t * 2 * (255 - 80));
          preview[pi + 1] = 220;
          preview[pi + 2] = 80;
        } else {
          preview[pi] = 255;
          preview[pi + 1] = Math.round(220 - (t - 0.5) * 2 * 180);
          preview[pi + 2] = 60;
        }
        preview[pi + 3] = 255;
      }
    }

    audioSpectrumBitmap.value = bitmap;
    audioSpectrumPreview.value = preview;
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
  const { sizeMode, aspectLongEdge, applyAspect, isAspectMatched } = useSizeMode({
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    onResize: () => { if (!isPlaying.value) scheduleProcess(); }
  });

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
    // Cap frames to avoid memory blowup
    const capped = payload.frames.length > MAX_FRAMES
      ? payload.frames.filter((_: any, i: number) => i % Math.ceil(payload.frames.length / MAX_FRAMES) === 0).slice(0, MAX_FRAMES)
      : payload.frames;
    extractedFrames.value = capped;
    startTime.value = capped[0]?.time ?? 0;
    endTime.value = payload.duration || capped[capped.length - 1]?.time || 0;
    selectedIndex.value = 0;
    isPlaying.value = false;
    // Cancel any in-flight re-process before applying size settings,
    // so the watcher that fires immediately after doesn't start a second run.
    processCancelToken.cancelled = true;
    if (sizeMode.value === 'aspect') applyAspect();
    processAll();
  }

  /** Full pipeline: validate file → extract frames (start/end/sampleFps) → decode audio → process. */
  async function loadVideoFile(file: File): Promise<boolean> {
    if (file.size > MAX_FILE_SIZE) {
      extractError.value = `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`;
      return false;
    }
    extractError.value = '';
    isExtracting.value = true;
    extractProgress.value = 0;
    pause();
    try {
      const result = await extractVideoFrames({
        file,
        startTime: 0,
        endTime: 0, // 0 → full duration
        sampleFps: sampleFps.value,
        sampleUnit: sampleUnit.value,
        everyNFrames: sampleEveryNFrames.value,
        onProgress: (captured, total) => { extractProgress.value = Math.min(1, captured / total); }
      });
      sourceFile.value = file;
      loadVideo(result);
      // Decode + modulo audio from the same video (non-fatal if track missing).
      try {
        decodedAudioBuffer.value = await decodeAudioFile(file);
        await syncAudioFromVideo();
      } catch {
        decodedAudioBuffer.value = null;
        await syncAudioFromVideo();
      }
      return true;
    } catch (error) {
      extractError.value = error instanceof Error ? error.message : 'Video failed to load';
      return false;
    } finally {
      isExtracting.value = false;
      extractProgress.value = 0;
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
    extractProgress.value = 0;
    pause();
    try {
      const result = await extractVideoFrames({
        file,
        startTime: startTime.value,
        endTime: endTime.value,
        sampleFps: sampleFps.value,
        sampleUnit: sampleUnit.value,
        everyNFrames: sampleEveryNFrames.value,
        onProgress: (captured, total) => { extractProgress.value = Math.min(1, captured / total); }
      });
      const keepStart = startTime.value;
      const keepEnd = endTime.value;
      loadVideo(result);
      startTime.value = keepStart;
      endTime.value = keepEnd || result.duration;
      // Keep audio modulo in sync with the new extraction window.
      await syncAudioFromVideo();
      return true;
    } catch (error) {
      extractError.value = error instanceof Error ? error.message : 'Frame extraction failed';
      return false;
    } finally {
      isExtracting.value = false;
      extractProgress.value = 0;
    }
  }

  // ── Playback ────────────────────────────────────────
  let playTimer: number | null = null;

  function play() {
    if (isPlaying.value) return;
    isPlaying.value = true;
    // Keep the video-frame preview in sync with the source audio track.
    const el = ensureAudioElement();
    if (el && decodedAudioBuffer.value) {
      const frame = processedFrames.value[selectedIndex.value];
      el.currentTime = frame?.time ?? startTime.value;
      void el.play().catch(() => {});
    }
    const interval = 1000 / outputFps.value;
    playTimer = window.setInterval(() => {
      if (selectedIndex.value >= processedFrames.value.length - 1) {
        selectedIndex.value = 0;
        if (el && decodedAudioBuffer.value) {
          el.currentTime = processedFrames.value[0]?.time ?? startTime.value;
        }
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
    if (audioPlayEl && !audioPlayEl.paused) audioPlayEl.pause();
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
      colorMode.value, colorByteOrder.value,
      scanDirection.value, bitOrder.value, polarity.value, outputFps.value,
    ],
    () => {
      if (!isPlaying.value) scheduleProcess();
    }
  );

  // Auto re-process audio on audio settings / clip window change (debounced)
  let audioTimer: ReturnType<typeof setTimeout> | null = null;
  watch(
    () => [
      audioModEnabled.value, audioPcmInOutput.value, audioSampleRate.value, audioBitDepth.value, audioByteOrder.value,
      audioNormalize.value, audioGain.value, startTime.value, endTime.value,
      audioWaveformWidth.value, audioWaveformHeight.value, audioVisualMode.value
    ],
    () => {
      if (!decodedAudioBuffer.value || !audioModEnabled.value) return;
      if (audioTimer) clearTimeout(audioTimer);
      audioTimer = setTimeout(() => {
        audioTimer = null;
        generateAudioVisuals();
        void processAudio();
      }, 200);
    }
  );

  const outputFileName = computed(() => `${outputName.value}.h`);
  function cleanup() {
    pause();
    if (audioPlayEl) {
      audioPlayEl.pause();
      audioPlayEl = null;
    }
    audioPlayUrl = '';
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
    decodedAudioBuffer.value = null;
    audioSamples.value = new Float32Array();
    audioBytes.value = new Uint8Array();
    audioPeak.value = 0;
    audioModEnabled.value = false;
    audioWaveformBitmap.value = null;
    audioWaveformPreview.value = null;
    audioSpectrumBitmap.value = null;
    audioSpectrumPreview.value = null;
  }

  return {
    // source
    fileName, sourceWidth, sourceHeight, duration, objectUrl,
    sourceFile, isExtracting, extractError, extractProgress,
    isProcessing,
    // raw
    extractedFrames,
    // processed
    processedFrames, selectedIndex, isPlaying, selectedFrame,
    // settings
    startTime, endTime, sampleFps, sampleUnit, sampleEveryNFrames, outputFps,
    targetWidth, targetHeight, brightness, contrast, threshold,
    dithering, scalingAlgorithm, colorMode, colorByteOrder,
    scanDirection, bitOrder, polarity, previewScale,
    // audio
    decodedAudioBuffer, audioSampleRate, audioBitDepth, audioByteOrder,
    audioNormalize, audioGain, audioSamples, audioBytes, audioPeak,
    isProcessingAudio, hasAudio, audioSampleCount, audioDuration,
    audioWaveformWidth, audioWaveformHeight,
    audioWaveformBitmap, audioWaveformPreview,
    audioSpectrumBitmap, audioSpectrumPreview,
    hasAudioWaveform,
    audioModEnabled, audioPlaying, audioPlayTime, audioPcmInOutput, audioVisualMode,
    enableAudioMod() {
      if (audioModEnabled.value) return;
      audioModEnabled.value = true;
      void syncAudioFromVideo();
    },
    syncAudioFromVideo,
    toggleAudioPcmOutput() {
      audioPcmInOutput.value = !audioPcmInOutput.value;
    },
    toggleAudioPlay, seekAudio,
    processAudio, generateAudioWaveformBitmap, generateAudioSpectrumBitmap,
    generateAudioVisuals,
    // size mode
    sizeMode, aspectLongEdge, applyAspect, isAspectMatched,
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
