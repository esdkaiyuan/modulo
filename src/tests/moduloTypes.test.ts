import { describe, expect, it } from 'vitest';
import { exportExtension, isColorMode } from '../features/shared/moduloTypes';

describe('shared modulo contracts', () => {
  it('classifies modes and maps every export extension', () => {
    expect(isColorMode('mono')).toBe(false);
    expect(isColorMode('rgb565')).toBe(true);
    expect(isColorMode('rgb888')).toBe(true);
    expect(isColorMode('palette16')).toBe(true);
    expect(exportExtension('c-array')).toBe('.h');
    expect(exportExtension('hex')).toBe('.hex.txt');
    expect(exportExtension('bin')).toBe('.bin');
  });
});
