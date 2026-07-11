export type ModuloMode = 'mono' | 'rgb565' | 'rgb888' | 'palette16';
export type ExportFormat = 'c-array' | 'hex' | 'bin';
export type Rgb565ByteOrder = 'msb-first' | 'lsb-first';
export type Rgb888Order = 'rgb' | 'bgr';

export interface EncodedModuloResult {
  mode: ModuloMode;
  width: number;
  height: number;
  bytes: Uint8Array;
  paletteBytes: Uint8Array;
  previewImageData: ImageData;
}

export function isColorMode(mode: ModuloMode): boolean {
  return mode !== 'mono';
}

export function exportExtension(format: ExportFormat): string {
  if (format === 'c-array') return '.h';
  if (format === 'hex') return '.hex.txt';
  return '.bin';
}
