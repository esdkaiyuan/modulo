import { describe, expect, it } from 'vitest';
import { BEAD_BRANDS, brandName, getBrand } from '../features/bead/paletteData';
import { colorLabel } from '../features/bead/patternRenderer';

describe('bead palettes', () => {
  it('exposes the five supported brands', () => {
    expect(BEAD_BRANDS.map((b) => b.id)).toEqual([
      'mard-standard',
      'artkal-s',
      'artkal-c',
      'perler',
      'hama-mini'
    ]);
  });

  it('pins the size of each palette', () => {
    const counts = Object.fromEntries(BEAD_BRANDS.map((b) => [b.id, b.colors.length]));
    expect(counts).toEqual({
      'mard-standard': 290,
      'artkal-s': 199,
      'artkal-c': 174,
      perler: 103,
      'hama-mini': 78
    });
  });

  it('keeps the first color of every source chart', () => {
    const has = (id: string, code: string) =>
      getBrand(id).colors.some((c) => c.code === code);
    expect(has('mard-standard', 'A1')).toBe(true);
    expect(has('artkal-s', 'S01')).toBe(true);
    expect(has('artkal-c', 'C01')).toBe(true);
    expect(has('perler', '80-15179')).toBe(true);
    expect(has('hama-mini', 'H01')).toBe(true);
  });

  it('keeps rgb in sync with hex and codes/colors unique per brand', () => {
    for (const brand of BEAD_BRANDS) {
      const codes = new Set<string>();
      const hexes = new Set<string>();
      for (const color of brand.colors) {
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/);
        const value = parseInt(color.hex.slice(1), 16);
        expect([color.r, color.g, color.b]).toEqual([
          (value >> 16) & 0xff,
          (value >> 8) & 0xff,
          value & 0xff
        ]);
        expect(codes.has(color.code)).toBe(false);
        expect(hexes.has(color.hex)).toBe(false);
        expect(color.name).not.toBe(color.code);
        codes.add(color.code);
        hexes.add(color.hex);
      }
    }
  });

  it('looks brands up by id and falls back to MARD', () => {
    expect(getBrand('artkal-c').defaultBoardSize).toBe(29);
    expect(getBrand('hama-mini').defaultBoardSize).toBe(57);
    expect(getBrand('does-not-exist')).toBe(BEAD_BRANDS[0]);
  });

  it('localizes brand names', () => {
    expect(brandName(getBrand('perler'))).toContain('Perler');
    expect(brandName(getBrand('mard-standard'))).not.toContain('bead.brand');
  });

  it('falls back to the symbol for long manufacturer codes', () => {
    expect(colorLabel('80-19001', 'A')).toBe('A');
    expect(colorLabel('H02', 'A')).toBe('H02');
    expect(colorLabel('S-01', 'A')).toBe('S01');
    expect(colorLabel('A1', 'A')).toBe('A1');
  });
});