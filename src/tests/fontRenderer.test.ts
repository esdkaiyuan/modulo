import { describe, expect, it } from 'vitest';
import { fitFontSizeToBitmap, fitGlyphToBox, fontImageDataToBitmap, inkBoxOf, makeFontIdentifier } from '../engines/fontRenderer';

describe('fontRenderer', () => {
  it('converts rendered text image data to a bitmap by luminance (alpha composited onto white)', () => {
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

    // Opaque ink → on; opaque/transparent white → off; semi-transparent ink
    // composites to 137 on white, so it is no longer darker than the threshold.
    expect(Array.from(fontImageDataToBitmap(image, 128, false))).toEqual([1, 0, 0, 0]);
    expect(Array.from(fontImageDataToBitmap(image, 128, true))).toEqual([0, 1, 1, 1]);
  });

  it('creates stable C identifiers for font text', () => {
    expect(makeFontIdentifier('汉', 32, 32)).toBe('font_u6c49_32x32');
    expect(makeFontIdentifier('AB', 16, 8)).toBe('font_AB_16x8');
  });

  it('fits oversized font sizes into the target bitmap window', () => {
    expect(fitFontSizeToBitmap(64, 32, 32)).toBe(28);
    expect(fitFontSizeToBitmap(18, 32, 32)).toBe(18);
  });

  it('shrinks the glyph so its ink box fits the cell, and centers that box', () => {
    // Ink 40 wide / 38 tall at 40px inside a 32×32 cell → scale 0.8, size 32.
    const fit = fitGlyphToBox({ left: 0, right: 40, ascent: 30, descent: 8 }, 40, 32, 32);
    expect(fit.fontSize).toBeCloseTo(32);
    expect(fit.x).toBeCloseTo(0);
    expect(fit.y).toBeCloseTo(24.8);
  });

  it('keeps the requested size when the ink already fits', () => {
    const fit = fitGlyphToBox({ left: 1, right: 31, ascent: 22, descent: 6 }, 40, 32, 32);
    expect(fit.fontSize).toBe(40);
    expect(fit.x).toBeCloseTo(1);
    expect(fit.y).toBeCloseTo(24);
  });

  it('falls back to em-box estimates when metrics lack ink bounds', () => {
    const ink = inkBoxOf({ width: 16 } as TextMetrics, 20);
    expect(ink.right).toBe(16);
    expect(ink.ascent).toBeCloseTo(16);
    expect(ink.descent).toBeCloseTo(4);
  });
});
