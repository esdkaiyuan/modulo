import { describe, expect, it } from 'vitest';
import {
  adjustGray,
  floydSteinbergDither,
  imageDataToGray,
  resizeNearest,
  thresholdGray
} from '../engines/imageProcessor';

describe('imageProcessor', () => {
  it('converts RGBA image data to luminance grayscale', () => {
    const image = new ImageData(
      new Uint8ClampedArray([
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,
        0, 0, 0, 0
      ]),
      2,
      2
    );

    expect(Array.from(imageDataToGray(image))).toEqual([76, 150, 29, 255]);
  });

  it('resizes grayscale data with nearest neighbor sampling', () => {
    const source = new Uint8ClampedArray([
      10, 20,
      30, 40
    ]);

    expect(Array.from(resizeNearest(source, 2, 2, 4, 2))).toEqual([
      10, 10, 20, 20,
      30, 30, 40, 40
    ]);
  });

  it('applies brightness, contrast, threshold, and dithering', () => {
    expect(adjustGray(100, 10, 1.2)).toBe(104);
    expect(Array.from(thresholdGray(new Uint8ClampedArray([0, 127, 128, 255]), 128))).toEqual([0, 0, 1, 1]);
    expect(Array.from(floydSteinbergDither(new Uint8ClampedArray([0, 80, 180, 255]), 2, 2, 128))).toEqual([0, 0, 1, 1]);
  });
});
