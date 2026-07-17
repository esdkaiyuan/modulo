import { describe, expect, it } from 'vitest';
import {
  findClosestPaletteColor,
  PALETTE_16_COLORS,
  palette16Bytes,
  processImageDataToColor,
  rgb332ToRgb,
  rgb565ToRgb,
  rgbToRgb332,
  rgbToRgb565
} from '../engines/colorProcessor';
import { formatColorArray } from '../engines/outputFormatter';

function solidImage(width: number, height: number, [r, g, b, a]: number[]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data.set([r, g, b, a], i * 4);
  }
  return new ImageData(data, width, height);
}

describe('colorProcessor', () => {
  it('converts RGB to RGB565 and back', () => {
    expect(rgbToRgb565(255, 0, 0)).toBe(0xf800);
    expect(rgbToRgb565(0, 255, 0)).toBe(0x07e0);
    expect(rgbToRgb565(0, 0, 255)).toBe(0x001f);
    expect(rgbToRgb565(255, 255, 255)).toBe(0xffff);
    expect(rgb565ToRgb(0xf800)).toEqual([248, 0, 0]);
  });

  it('converts RGB to RGB332 and expands back to full range', () => {
    expect(rgbToRgb332(255, 0, 0)).toBe(0b11100000);
    expect(rgbToRgb332(0, 255, 0)).toBe(0b00011100);
    expect(rgbToRgb332(0, 0, 255)).toBe(0b00000011);
    expect(rgb332ToRgb(0b11111111)).toEqual([255, 255, 255]);
    expect(rgb332ToRgb(0)).toEqual([0, 0, 0]);
  });

  it('finds the closest palette color', () => {
    expect(findClosestPaletteColor(250, 5, 5, PALETTE_16_COLORS)).toBe(2); // red
    expect(findClosestPaletteColor(10, 10, 10, PALETTE_16_COLORS)).toBe(0); // black
  });

  it('encodes rgb565 with selectable byte order', () => {
    const image = solidImage(2, 1, [255, 0, 0, 255]);
    const big = processImageDataToColor(image, {
      targetWidth: 2, targetHeight: 1, brightness: 0, contrast: 1, format: 'rgb565', byteOrder: 'big'
    });
    expect(Array.from(big.bytes)).toEqual([0xf8, 0x00, 0xf8, 0x00]);

    const little = processImageDataToColor(image, {
      targetWidth: 2, targetHeight: 1, brightness: 0, contrast: 1, format: 'rgb565', byteOrder: 'little'
    });
    expect(Array.from(little.bytes)).toEqual([0x00, 0xf8, 0x00, 0xf8]);
  });

  it('encodes rgb888 as 3 bytes per pixel and rgb332 as 1', () => {
    const image = solidImage(1, 1, [12, 200, 99, 255]);
    const rgb888 = processImageDataToColor(image, {
      targetWidth: 1, targetHeight: 1, brightness: 0, contrast: 1, format: 'rgb888'
    });
    expect(Array.from(rgb888.bytes)).toEqual([12, 200, 99]);

    const rgb332 = processImageDataToColor(image, {
      targetWidth: 1, targetHeight: 1, brightness: 0, contrast: 1, format: 'rgb332'
    });
    expect(rgb332.bytes.length).toBe(1);
    expect(rgb332.bytes[0]).toBe(rgbToRgb332(12, 200, 99));
  });

  it('resizes before quantizing (2x2 → 1x1 nearest picks top-left)', () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255,
      0, 0, 255, 255, 255, 255, 255, 255
    ]);
    const image = new ImageData(data, 2, 2);
    const result = processImageDataToColor(image, {
      targetWidth: 1, targetHeight: 1, brightness: 0, contrast: 1, format: 'rgb565'
    });
    expect(Array.from(result.bytes)).toEqual([0xf8, 0x00]);
  });

  it('composites transparent pixels onto white', () => {
    const image = solidImage(1, 1, [0, 0, 0, 0]);
    const result = processImageDataToColor(image, {
      targetWidth: 1, targetHeight: 1, brightness: 0, contrast: 1, format: 'rgb888'
    });
    expect(Array.from(result.bytes)).toEqual([255, 255, 255]);
  });

  it('emits a preview matching the quantized output', () => {
    const image = solidImage(1, 1, [255, 0, 0, 255]);
    const result = processImageDataToColor(image, {
      targetWidth: 1, targetHeight: 1, brightness: 0, contrast: 1, format: 'palette16'
    });
    expect(result.bytes[0]).toBe(2); // palette red
    expect(Array.from(result.preview)).toEqual([255, 0, 0, 255]);
  });

  it('palette16Bytes respects byte order', () => {
    const big = palette16Bytes('big');
    expect([big[2], big[3]]).toEqual([0xff, 0xff]); // white = 0xFFFF
    const little = palette16Bytes('little');
    expect([little[4], little[5]]).toEqual([0x00, 0xf8]); // red = 0xF800 LE
  });
});

describe('formatColorArray', () => {
  it('formats rgb565 as uint16_t words', () => {
    const source = formatColorArray(new Uint8Array([0xf8, 0x00]), 'rgb565', { name: 'img', width: 1, height: 1 });
    expect(source).toContain('const uint16_t img[] PROGMEM');
    expect(source).toContain('0xF800');
  });

  it('formats palette16 with palette table and index bytes', () => {
    const source = formatColorArray(new Uint8Array([2, 0]), 'palette16', { name: 'img', width: 2, height: 1 });
    expect(source).toContain('const uint16_t img_palette[] PROGMEM');
    expect(source).toContain('const uint8_t img[] PROGMEM');
    expect(source).toContain('0x02, 0x00');
  });

  it('formats rgb888 as byte triples', () => {
    const source = formatColorArray(new Uint8Array([1, 2, 3]), 'rgb888', { name: 'img', width: 1, height: 1 });
    expect(source).toContain('const uint8_t img[] PROGMEM');
    expect(source).toContain('0x01, 0x02, 0x03');
  });
});
