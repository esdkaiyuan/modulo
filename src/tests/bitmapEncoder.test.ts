import { describe, expect, it } from 'vitest';
import { encodeBitmap } from '../engines/bitmapEncoder';
import { formatCArray, makeHeaderFilename } from '../engines/outputFormatter';

describe('bitmapEncoder', () => {
  it('encodes bitmap bits with scan, polarity, and bit order options', () => {
    const bitmap = new Uint8Array([
      1, 0, 1, 0,
      1, 0, 1, 0
    ]);

    expect(Array.from(encodeBitmap(bitmap, 4, 2, { bitOrder: 'msb', polarity: 'positive', scan: 'horizontal-ltr' }))).toEqual([0xaa]);
    expect(Array.from(encodeBitmap(bitmap, 4, 2, { bitOrder: 'lsb', polarity: 'positive', scan: 'horizontal-ltr' }))).toEqual([0x55]);
    expect(Array.from(encodeBitmap(bitmap, 4, 2, { bitOrder: 'msb', polarity: 'negative', scan: 'horizontal-ltr' }))).toEqual([0x55]);
  });

  it('formats encoded bytes as a named C header', () => {
    const output = formatCArray(new Uint8Array([0xaa, 0x55]), {
      name: 'panda_128x64',
      width: 128,
      height: 64,
      bytesPerLine: 8
    });

    expect(output).toContain('// Resolution: 128x64, 1bpp');
    expect(output).toContain('const uint8_t panda_128x64[] PROGMEM = {');
    expect(output).toContain('0xAA, 0x55');
    expect(makeHeaderFilename('panda 128x64.png')).toBe('panda_128x64.h');
  });
});
