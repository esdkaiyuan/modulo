import { defineStore } from 'pinia';
import { computed, ref, shallowRef, watch } from 'vue';
import {
  decodeAudioFile,
  quantizeSamples,
  resampleToMono,
  type AudioBitDepth,
  type AudioByteOrder
} from '../../../engines/audioProcessor';
import { makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';

export const useAudioModuloStore = defineStore('audioModulo', () => {
  // ── Source ──
  const fileName = ref('');
  const fileSize = ref(0);
  const objectUrl = ref('');
  const sourceSampleRate = ref(0);
  const sourceChannels = ref(0);
  const duration = ref(0);
  const decodedBuffer = shallowRef<AudioBuffer | null>(null);
  const loadError = ref('');
  const isProcessing = ref(false);

  // ── Settings ──
  const startTime = ref(0);
  const endTime = ref(0);
  const sampleRate = ref(16000);
  const bitDepth = ref<AudioBitDepth>(8);
  const byteOrder = ref<AudioByteOrder>('little');
  const normalize = ref(true);
  const gain = ref(1);

  // ── Results ──
  const samples = shallowRef<Float32Array>(new Float32Array());
  const bytes = shallowRef<Uint8Array>(new Uint8Array());
  const peak = ref(0);

  const hasAudio = computed(() => !!decodedBuffer.value);
  const outputName = computed(() => {
    const base = sanitizeIdentifier(fileName.value.replace(/\.[^.]+$/, '') || 'audio');
    return `audio_${base}`;
  });
  const outputFileName = computed(() => `${outputName.value}.h`);
  const clipDuration = computed(() => Math.max(0, endTime.value - startTime.value));

  async function loadAudioFile(file: File) {
    loadError.value = '';
    try {
      const buffer = await decodeAudioFile(file);
      if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
      objectUrl.value = URL.createObjectURL(file);
      fileName.value = file.name;
      fileSize.value = file.size;
      decodedBuffer.value = buffer;
      sourceSampleRate.value = buffer.sampleRate;
      sourceChannels.value = buffer.numberOfChannels;
      duration.value = buffer.duration;
      startTime.value = 0;
      endTime.value = Math.round(buffer.duration * 100) / 100;
      await process();
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Audio decode failed';
    }
  }

  async function process() {
    const buffer = decodedBuffer.value;
    if (!buffer) return;
    isProcessing.value = true;
    try {
      const mono = await resampleToMono(buffer, sampleRate.value, startTime.value, endTime.value);
      const result = quantizeSamples(mono, {
        bitDepth: bitDepth.value,
        byteOrder: byteOrder.value,
        gain: gain.value,
        normalize: normalize.value
      });
      samples.value = mono;
      bytes.value = result.bytes;
      peak.value = result.peak;
    } finally {
      isProcessing.value = false;
    }
  }

  const generatedSource = computed(() => {
    const data = bytes.value;
    if (!data.length) return '';
    const name = outputName.value;
    const sampleCount = samples.value.length;
    const head = [
      `// PCM audio: ${sampleCount} samples, ${sampleRate.value} Hz, mono`,
      bitDepth.value === 8
        ? '// Format: 8-bit unsigned (0x80 = silence)'
        : `// Format: 16-bit signed, ${byteOrder.value}-endian byte stream`,
      `// Duration: ${(sampleCount / sampleRate.value).toFixed(3)} s`
    ];
    const lines: string[] = [];
    if (bitDepth.value === 8) {
      lines.push(`const uint8_t ${name}[] PROGMEM = {`);
      for (let i = 0; i < data.length; i += 16) {
        const chunk = Array.from(data.slice(i, i + 16), (b) => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`);
        lines.push(`  ${chunk.join(', ')}${i + 16 < data.length ? ',' : ''}`);
      }
    } else {
      // Emit int16_t values so C code indexes samples directly.
      lines.push(`const int16_t ${name}[] PROGMEM = {`);
      const words: string[] = [];
      for (let i = 0; i + 1 < data.length; i += 2) {
        const raw = byteOrder.value === 'little' ? data[i] | (data[i + 1] << 8) : (data[i] << 8) | data[i + 1];
        words.push(String(raw > 32767 ? raw - 65536 : raw));
      }
      for (let i = 0; i < words.length; i += 12) {
        lines.push(`  ${words.slice(i, i + 12).join(', ')}${i + 12 < words.length ? ',' : ''}`);
      }
    }
    lines.push('};');
    lines.push(`const uint32_t ${name}_len = ${sampleCount};`);
    lines.push(`const uint32_t ${name}_rate = ${sampleRate.value};`);
    return [...head, '', ...lines].join('\n');
  });

  function outputBlob() {
    return makeTextBlob(generatedSource.value);
  }

  // ── Playback of the processed (quantized) result ──
  const isPlaying = ref(false);
  let playContext: AudioContext | null = null;
  let playSource: AudioBufferSourceNode | null = null;

  async function playProcessed() {
    stopPlayback();
    if (!samples.value.length) return;
    playContext = playContext ?? new AudioContext();
    await playContext.resume();

    // Re-decode the quantized bytes so the user hears the real output quality.
    const data = bytes.value;
    const count = samples.value.length;
    const audible = new Float32Array(count);
    if (bitDepth.value === 8) {
      for (let i = 0; i < count; i += 1) audible[i] = data[i] / 127.5 - 1;
    } else {
      for (let i = 0; i < count; i += 1) {
        const raw = byteOrder.value === 'little' ? data[i * 2] | (data[i * 2 + 1] << 8) : (data[i * 2] << 8) | data[i * 2 + 1];
        audible[i] = (raw > 32767 ? raw - 65536 : raw) / 32768;
      }
    }
    const buffer = playContext.createBuffer(1, count, sampleRate.value);
    buffer.copyToChannel(audible, 0);
    playSource = playContext.createBufferSource();
    playSource.buffer = buffer;
    playSource.connect(playContext.destination);
    playSource.onended = () => { isPlaying.value = false; };
    playSource.start();
    isPlaying.value = true;
  }

  function stopPlayback() {
    if (playSource) {
      playSource.onended = null;
      try { playSource.stop(); } catch { /* already stopped */ }
      playSource = null;
    }
    isPlaying.value = false;
  }

  // Auto re-process on setting changes (debounced).
  let timer: ReturnType<typeof setTimeout> | null = null;
  watch(
    () => [startTime.value, endTime.value, sampleRate.value, bitDepth.value, byteOrder.value, normalize.value, gain.value],
    () => {
      if (!decodedBuffer.value) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void process();
      }, 150);
    }
  );

  function reset() {
    stopPlayback();
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = '';
    fileName.value = '';
    fileSize.value = 0;
    decodedBuffer.value = null;
    sourceSampleRate.value = 0;
    sourceChannels.value = 0;
    duration.value = 0;
    startTime.value = 0;
    endTime.value = 0;
    samples.value = new Float32Array();
    bytes.value = new Uint8Array();
    peak.value = 0;
    loadError.value = '';
  }

  return {
    fileName,
    fileSize,
    objectUrl,
    sourceSampleRate,
    sourceChannels,
    duration,
    loadError,
    isProcessing,
    startTime,
    endTime,
    sampleRate,
    bitDepth,
    byteOrder,
    normalize,
    gain,
    samples,
    bytes,
    peak,
    hasAudio,
    clipDuration,
    outputName,
    outputFileName,
    generatedSource,
    isPlaying,
    loadAudioFile,
    process,
    playProcessed,
    stopPlayback,
    outputBlob,
    reset
  };
});
