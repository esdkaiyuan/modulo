/**
 * Audio → embedded PCM conversion engine.
 *
 * Pipeline: decode (Web Audio) → resample to mono at target rate
 * (OfflineAudioContext) → gain / normalize → quantize to 8-bit unsigned
 * or 16-bit signed PCM bytes.
 */

export type AudioBitDepth = 8 | 16;
export type AudioByteOrder = 'big' | 'little';

export const SAMPLE_RATES = [8000, 11025, 16000, 22050, 32000, 44100] as const;

export interface QuantizeAudioOptions {
  bitDepth: AudioBitDepth;
  /** Only used for 16-bit output. Little-endian is the common PCM/WAV layout. */
  byteOrder?: AudioByteOrder;
  /** Linear gain multiplier applied before quantization. */
  gain?: number;
  /** Scale so the peak hits full range (applied after gain). */
  normalize?: boolean;
}

export interface QuantizeAudioResult {
  bytes: Uint8Array;
  /** Peak absolute amplitude after gain/normalize (0..1), for clip indication. */
  peak: number;
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const data = await file.arrayBuffer();
  // A plain AudioContext decodes every format the browser supports;
  // it is only used for decoding, never started for playback here.
  const context = new AudioContext();
  try {
    return await context.decodeAudioData(data);
  } finally {
    void context.close();
  }
}

/** Resample a time slice of the buffer to mono at targetRate. */
export async function resampleToMono(
  buffer: AudioBuffer,
  targetRate: number,
  startTime = 0,
  endTime = buffer.duration
): Promise<Float32Array> {
  const start = Math.max(0, Math.min(startTime, buffer.duration));
  const duration = Math.max(0.001, Math.min(endTime, buffer.duration) - start);
  const length = Math.max(1, Math.ceil(duration * targetRate));
  const offline = new OfflineAudioContext(1, length, targetRate);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0, start, duration);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice(0, length);
}

export function quantizeSamples(samples: Float32Array, options: QuantizeAudioOptions): QuantizeAudioResult {
  const gain = options.gain ?? 1;
  const byteOrder = options.byteOrder ?? 'little';

  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.abs(samples[i] * gain);
    if (value > peak) peak = value;
  }
  const scale = options.normalize && peak > 0 ? gain / peak : gain;
  const clippedPeak = options.normalize && peak > 0 ? 1 : Math.min(1, peak);

  if (options.bitDepth === 8) {
    const bytes = new Uint8Array(samples.length);
    for (let i = 0; i < samples.length; i += 1) {
      const v = Math.max(-1, Math.min(1, samples[i] * scale));
      bytes[i] = Math.round((v * 0.5 + 0.5) * 255);
    }
    return { bytes, peak: clippedPeak };
  }

  const bytes = new Uint8Array(samples.length * 2);
  for (let i = 0; i < samples.length; i += 1) {
    const v = Math.max(-1, Math.min(1, samples[i] * scale));
    const word = Math.round(v * 32767) & 0xffff;
    if (byteOrder === 'little') {
      bytes[i * 2] = word & 0xff;
      bytes[i * 2 + 1] = (word >> 8) & 0xff;
    } else {
      bytes[i * 2] = (word >> 8) & 0xff;
      bytes[i * 2 + 1] = word & 0xff;
    }
  }
  return { bytes, peak: clippedPeak };
}

/** Min/max envelope for waveform rendering: `buckets` pairs of [min, max]. */
export function waveformEnvelope(samples: Float32Array, buckets: number): Float32Array {
  const envelope = new Float32Array(buckets * 2);
  if (!samples.length) return envelope;
  const step = samples.length / buckets;
  for (let b = 0; b < buckets; b += 1) {
    const from = Math.floor(b * step);
    const to = Math.min(samples.length, Math.max(from + 1, Math.floor((b + 1) * step)));
    let min = 1;
    let max = -1;
    for (let i = from; i < to; i += 1) {
      const v = samples[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    envelope[b * 2] = min;
    envelope[b * 2 + 1] = max;
  }
  return envelope;
}
