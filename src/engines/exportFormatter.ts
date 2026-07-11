import type { EncodedModuloResult, ExportFormat } from '../features/shared/moduloTypes';
import { exportExtension } from '../features/shared/moduloTypes';
import { sanitizeIdentifier } from './outputFormatter';

export interface ExportNameOptions {
  name: string;
}

export function serializedBytes(result: EncodedModuloResult): Uint8Array {
  if (result.mode !== 'palette16') return new Uint8Array(result.bytes);
  const output = new Uint8Array(result.paletteBytes.length + result.bytes.length);
  output.set(result.paletteBytes);
  output.set(result.bytes, result.paletteBytes.length);
  return output;
}

function formatByte(byte: number): string {
  return `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`;
}

export function formatModuloC(result: EncodedModuloResult, options: ExportNameOptions): string {
  const name = sanitizeIdentifier(options.name);
  const bytes = serializedBytes(result);
  const lines = [
    `// Resolution: ${result.width}x${result.height}, ${result.mode}`,
    `// Total bytes: ${bytes.length}`,
    `const uint8_t ${name}[] PROGMEM = {`
  ];
  for (let index = 0; index < bytes.length; index += 16) {
    const chunk = Array.from(bytes.slice(index, index + 16)).map(formatByte).join(', ');
    lines.push(`  ${chunk}${index + 16 < bytes.length ? ',' : ''}`);
  }
  lines.push('};');
  if (result.mode === 'palette16') {
    lines.splice(1, 0, `// Palette bytes: ${result.paletteBytes.length}, packed pixel bytes: ${result.bytes.length}`);
  }
  return lines.join('\n');
}

export function formatModuloHex(result: EncodedModuloResult): string {
  const bytes = serializedBytes(result);
  const rows: string[] = [];
  for (let index = 0; index < bytes.length; index += 16) {
    rows.push(Array.from(bytes.slice(index, index + 16))
      .map((byte) => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(' '));
  }
  return rows.join('\n');
}

export function makeModuloBlob(
  result: EncodedModuloResult,
  format: ExportFormat,
  options: ExportNameOptions = { name: 'bitmap' }
): Blob {
  if (format === 'c-array') return new Blob([formatModuloC(result, options)], { type: 'text/plain;charset=utf-8' });
  if (format === 'hex') return new Blob([formatModuloHex(result)], { type: 'text/plain;charset=utf-8' });
  return new Blob([new Uint8Array(serializedBytes(result))], { type: 'application/octet-stream' });
}

export function makeModuloFileName(baseName: string, format: ExportFormat): string {
  return `${sanitizeIdentifier(baseName)}${exportExtension(format)}`;
}
