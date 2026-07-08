import { describe, expect, it } from 'vitest';
import { fontImageDataToBitmap, makeFontIdentifier } from '../engines/fontRenderer';

describe('fontRenderer', () => {
  it('converts rendered text image data to a bitmap using alpha and luminance', () => {
    const image = new ImageData(
      new Uint8ClampedArray([
        0, 0, 0, 255,
        255, 255, 255, 255,
        0, 0, 0, 0,
        20, 20, 20, 128
      ]),
      2,
      2
    );

    expect(Array.from(fontImageDataToBitmap(image, 128, false))).toEqual([1, 0, 0, 1]);
    expect(Array.from(fontImageDataToBitmap(image, 128, true))).toEqual([0, 1, 1, 0]);
  });

  it('creates stable C identifiers for font text', () => {
    expect(makeFontIdentifier('汉', 32, 32)).toBe('font_u6c49_32x32');
    expect(makeFontIdentifier('AB', 16, 8)).toBe('font_AB_16x8');
  });
});
