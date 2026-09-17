import { describe, expect, it } from 'vitest';
import { floodFill, lineCells } from '../engines/fill';
import { formatCArray, packBitsToBytes, pixelsToBits } from '../engines/modulo';

describe('modulo engine', () => {
  it('packs row-major pixel occupancy into msb-first bytes', () => {
    const pixels = [
      '#000000', null, '#000000', null,
      '#000000', null, '#000000', null
    ];

    expect(pixelsToBits(pixels)).toEqual([1, 0, 1, 0, 1, 0, 1, 0]);
    expect(Array.from(packBitsToBytes(pixelsToBits(pixels)))).toEqual([0xaa]);
  });

  it('formats bytes as a C PROGMEM array with dimensions in the name', () => {
    const output = formatCArray(new Uint8Array([0xaa, 0x0f]), 4, 4);

    expect(output).toContain('const uint8_t image_4x4[] PROGMEM = {');
    expect(output).toContain('0xAA, 0x0F');
  });
});

describe('lineCells', () => {
  it('interpolates every cell between two points', () => {
    expect(lineCells(0, 0, 3, 0)).toEqual([[0, 0], [1, 0], [2, 0], [3, 0]]);
    expect(lineCells(0, 0, 3, 3)).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]]);
    expect(lineCells(2, 2, 2, 2)).toEqual([[2, 2]]);
    expect(lineCells(3, 0, 0, 0)).toEqual([[3, 0], [2, 0], [1, 0], [0, 0]]);
  });

  it('covers every column on shallow diagonals (no gaps across a fast drag)', () => {
    const cells = lineCells(0, 0, 5, 2);
    expect(cells.length).toBe(6);
    expect(new Set(cells.map(([x]) => x)).size).toBe(6);
    expect(cells[cells.length - 1]).toEqual([5, 2]);
  });
});

describe('floodFill', () => {
  it('replaces only the contiguous region matching the target pixel', () => {
    const pixels = [
      null, null, '#111111',
      null, '#222222', '#111111',
      '#333333', '#333333', '#111111'
    ];

    const result = floodFill(pixels, 3, 3, 0, 0, '#FF6B9D');

    expect(result).toEqual([
      '#FF6B9D', '#FF6B9D', '#111111',
      '#FF6B9D', '#222222', '#111111',
      '#333333', '#333333', '#111111'
    ]);
  });
});
