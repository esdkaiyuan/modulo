import { describe, it, expect } from 'vitest';
import { fitToAspect, matchesAspect } from '../features/shared/sizeMode';

describe('fitToAspect', () => {
  it('maps the longer source side to the long edge (landscape)', () => {
    expect(fitToAspect(320, 240, 128)).toEqual({ width: 128, height: 96 });
  });

  it('maps the longer source side to the long edge (portrait)', () => {
    expect(fitToAspect(240, 320, 128)).toEqual({ width: 96, height: 128 });
  });

  it('keeps a square source square', () => {
    expect(fitToAspect(500, 500, 64)).toEqual({ width: 64, height: 64 });
  });

  it('never returns a zero dimension for extreme ratios', () => {
    const { width, height } = fitToAspect(1000, 1, 64);
    expect(width).toBeGreaterThanOrEqual(1);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  it('falls back to a square box when the source size is unknown', () => {
    expect(fitToAspect(0, 0, 48)).toEqual({ width: 48, height: 48 });
  });
});

describe('matchesAspect', () => {
  it('is true when W×H already follows the source ratio', () => {
    expect(matchesAspect(320, 240, 128, 96)).toBe(true);
  });

  it('is false when W×H distorts the source', () => {
    expect(matchesAspect(320, 240, 128, 128)).toBe(false);
  });
});
