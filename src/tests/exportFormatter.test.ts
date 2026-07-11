import { describe, expect, it } from 'vitest';
import {
  formatModuloC,
  formatModuloHex,
  makeModuloBlob,
  makeModuloFileName,
  serializedBytes
} from '../engines/exportFormatter';
import type { EncodedModuloResult, ModuloMode } from '../features/shared/moduloTypes';

function fixtureResult(mode: ModuloMode): EncodedModuloResult {
  return {
    mode,
    width: 2,
    height: 1,
    bytes: new Uint8Array(mode === 'palette16' ? [0x12] : [0x12, 0xAB]),
    paletteBytes: mode === 'palette16' ? new Uint8Array([0xF8, 0x00]) : new Uint8Array(),
    previewImageData: new ImageData(new Uint8ClampedArray(8), 2, 1)
  };
}

function readBlob(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
}

describe('exportFormatter', () => {
  it.each(['mono', 'rgb565', 'rgb888', 'palette16'] as const)(
    'exports identical %s bytes to C, HEX, and BIN', async (mode) => {
      const result = fixtureResult(mode);
      const expected = Array.from(serializedBytes(result));
      const binary = await readBlob(makeModuloBlob(result, 'bin'));
      expect(Array.from(binary)).toEqual(expected);
      expect(formatModuloHex(result)).toContain(expected.map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' '));
      for (const byte of expected) {
        expect(formatModuloC(result, { name: 'sample' })).toContain(`0x${byte.toString(16).padStart(2, '0').toUpperCase()}`);
      }
    }
  );

  it('places a Palette16 palette before packed pixel indices', () => {
    expect(Array.from(serializedBytes(fixtureResult('palette16')))).toEqual([0xF8, 0x00, 0x12]);
  });

  it('uses the requested export extension', () => {
    expect(makeModuloFileName('demo.png', 'c-array')).toBe('demo.h');
    expect(makeModuloFileName('demo.png', 'hex')).toBe('demo.hex.txt');
    expect(makeModuloFileName('demo.png', 'bin')).toBe('demo.bin');
  });
});
