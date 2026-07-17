import { describe, expect, it } from 'vitest';
import { quantizeSamples, waveformEnvelope } from '../engines/audioProcessor';

describe('quantizeSamples', () => {
  it('maps silence to 0x80 in 8-bit unsigned', () => {
    const { bytes } = quantizeSamples(new Float32Array([0, 0]), { bitDepth: 8 });
    expect(Array.from(bytes)).toEqual([128, 128]);
  });

  it('maps full-scale extremes in 8-bit', () => {
    const { bytes } = quantizeSamples(new Float32Array([1, -1]), { bitDepth: 8 });
    expect(Array.from(bytes)).toEqual([255, 0]);
  });

  it('emits 16-bit little-endian by default', () => {
    const { bytes } = quantizeSamples(new Float32Array([1]), { bitDepth: 16 });
    // 32767 = 0x7FFF → LE: FF 7F
    expect(Array.from(bytes)).toEqual([0xff, 0x7f]);
  });

  it('emits 16-bit big-endian when requested', () => {
    const { bytes } = quantizeSamples(new Float32Array([1]), { bitDepth: 16, byteOrder: 'big' });
    expect(Array.from(bytes)).toEqual([0x7f, 0xff]);
  });

  it('encodes negative samples as two\'s complement', () => {
    const { bytes } = quantizeSamples(new Float32Array([-1]), { bitDepth: 16 });
    // -32767 = 0x8001 → LE: 01 80
    expect(Array.from(bytes)).toEqual([0x01, 0x80]);
  });

  it('normalize scales the peak to full range', () => {
    const { bytes, peak } = quantizeSamples(new Float32Array([0.5, -0.25]), { bitDepth: 8, normalize: true });
    expect(peak).toBe(1);
    expect(bytes[0]).toBe(255); // 0.5 → peak → +1
    expect(bytes[1]).toBe(64);  // -0.25 → -0.5 → 0.25 * 255 ≈ 64
  });

  it('clamps clipping gain and reports peak', () => {
    const { bytes, peak } = quantizeSamples(new Float32Array([0.8]), { bitDepth: 8, gain: 2 });
    expect(peak).toBe(1);
    expect(bytes[0]).toBe(255);
  });
});

describe('waveformEnvelope', () => {
  it('returns min/max pairs per bucket', () => {
    const envelope = waveformEnvelope(new Float32Array([0.5, -0.5, 0.1, -0.1]), 2);
    expect(envelope[0]).toBe(-0.5); // bucket 0 min
    expect(envelope[1]).toBe(0.5);  // bucket 0 max
    expect(envelope[2]).toBe(-0.1);
    expect(envelope[3]).toBe(0.1);
  });
});
