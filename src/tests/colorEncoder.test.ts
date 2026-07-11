import { describe, expect, it } from 'vitest';
import {
  createPalette16,
  decodeRgb565,
  decodeRgb888,
  encodePalette16,
  encodeRgb565,
  encodeRgb888,
  scanPixelIndices
} from '../engines/colorEncoder';

function imageData(pixels: number[][], width: number, height: number): ImageData {
  return new ImageData(new Uint8ClampedArray(pixels.flat()), width, height);
}

describe('colorEncoder', () => {
  it('encodes RGB565 byte order and RGB888 channel order', () => {
    const source = imageData([[255, 0, 0, 255], [0, 255, 0, 255]], 2, 1);
    expect(Array.from(encodeRgb565(source, { scan: 'horizontal-ltr' }, 'msb-first')))
      .toEqual([0xF8, 0x00, 0x07, 0xE0]);
    expect(Array.from(encodeRgb565(source, { scan: 'horizontal-ltr' }, 'lsb-first')))
      .toEqual([0x00, 0xF8, 0xE0, 0x07]);
    expect(Array.from(encodeRgb888(source, { scan: 'horizontal-ltr' }, 'bgr')))
      .toEqual([0, 0, 255, 0, 255, 0]);
  });

  it('shares traversal with mono modes and composites transparent pixels', () => {
    expect(scanPixelIndices(2, 2, 'vertical-btt')).toEqual([2, 0, 3, 1]);
    const source = imageData([[255, 0, 0, 255], [0, 0, 0, 0]], 2, 1);
    expect(Array.from(encodeRgb888(source, { scan: 'horizontal-rtl' }, 'rgb', '#FFFFFF')))
      .toEqual([255, 255, 255, 255, 0, 0]);
  });

  it('packs two palette indices per byte and pads an odd pixel', () => {
    const source = imageData([
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255]
    ], 3, 1);
    const palette = createPalette16([source]);
    const result = encodePalette16(source, { scan: 'horizontal-ltr' }, palette);
    expect(result.paletteBytes).toHaveLength(32);
    expect(result.pixelBytes).toHaveLength(2);
    expect(result.pixelBytes[0] >> 4).toBe(result.indices[0]);
    expect(result.pixelBytes[0] & 0x0F).toBe(result.indices[1]);
    expect(result.pixelBytes[1] >> 4).toBe(result.indices[2]);
    expect(result.pixelBytes[1] & 0x0F).toBe(0);
  });

  it('decodes encoded bytes back into raster preview order', () => {
    const source = imageData([[255, 0, 0, 255], [0, 255, 0, 255]], 2, 1);
    const rgb565 = encodeRgb565(source, { scan: 'horizontal-rtl' }, 'msb-first');
    const preview565 = decodeRgb565(rgb565, 2, 1, { scan: 'horizontal-rtl' }, 'msb-first');
    expect(preview565.data[0]).toBeGreaterThan(240);
    expect(preview565.data[5]).toBeGreaterThan(240);

    const rgb888 = encodeRgb888(source, { scan: 'horizontal-rtl' }, 'bgr');
    expect(Array.from(decodeRgb888(rgb888, 2, 1, { scan: 'horizontal-rtl' }, 'bgr').data))
      .toEqual(Array.from(source.data));
  });
});
