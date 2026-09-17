import { describe, expect, it } from 'vitest';
import { compositeGifFrames, type GifFrameInput } from '../features/animation/utils/gifDecoder';

const rgba = (r: number, g: number, b: number, a = 255) => [r, g, b, a];

const at = (buffer: Uint8ClampedArray, width: number, x: number, y: number) =>
  Array.from(buffer.slice((y * width + x) * 4, (y * width + x) * 4 + 4));

function frame(
  [left, top, width, height]: [number, number, number, number],
  pixels: number[][],
  disposalType: number
): GifFrameInput {
  return {
    dims: { left, top, width, height },
    patch: new Uint8ClampedArray(pixels.flat()),
    disposalType
  };
}

describe('GIF frame compositing', () => {
  it('keeps the underlay under transparent patch pixels', () => {
    const frames = [
      frame([0, 0, 2, 2], [rgba(255, 0, 0), rgba(255, 0, 0), rgba(255, 0, 0), rgba(255, 0, 0)], 1),
      frame([0, 0, 1, 1], [rgba(0, 0, 255)], 1)
    ];
    const out = compositeGifFrames(frames, 2, 2);
    expect(at(out[1], 2, 0, 0)).toEqual(rgba(0, 0, 255));
    expect(at(out[1], 2, 1, 0)).toEqual(rgba(255, 0, 0));
    expect(at(out[1], 2, 0, 1)).toEqual(rgba(255, 0, 0));
    expect(at(out[1], 2, 1, 1)).toEqual(rgba(255, 0, 0));
  });

  it('clears the previous rect when disposal is 2 (restore to background)', () => {
    const frames = [
      frame([1, 1, 1, 1], [rgba(0, 255, 0)], 2),
      frame([0, 0, 1, 1], [rgba(255, 255, 255)], 1)
    ];
    const out = compositeGifFrames(frames, 2, 2);
    expect(at(out[1], 2, 0, 0)).toEqual(rgba(255, 255, 255));
    expect(at(out[1], 2, 1, 1)).toEqual(rgba(0, 0, 0, 0));
  });

  it('restores the pre-frame state when disposal is 3', () => {
    const frames = [
      frame([0, 0, 2, 2], [rgba(255, 0, 0), rgba(255, 0, 0), rgba(255, 0, 0), rgba(255, 0, 0)], 1),
      frame([0, 0, 1, 1], [rgba(0, 0, 255)], 3),
      frame([1, 1, 1, 1], [rgba(255, 255, 255)], 1)
    ];
    const out = compositeGifFrames(frames, 2, 2);
    expect(at(out[1], 2, 0, 0)).toEqual(rgba(0, 0, 255));
    expect(at(out[2], 2, 0, 0)).toEqual(rgba(255, 0, 0));
    expect(at(out[2], 2, 1, 1)).toEqual(rgba(255, 255, 255));
  });

  it('clips patches that extend past the canvas', () => {
    const frames = [frame([1, 1, 2, 2], [rgba(1, 2, 3), rgba(4, 5, 6), rgba(7, 8, 9), rgba(10, 11, 12)], 1)];
    const out = compositeGifFrames(frames, 2, 2);
    expect(at(out[0], 2, 1, 1)).toEqual(rgba(1, 2, 3));
  });
});