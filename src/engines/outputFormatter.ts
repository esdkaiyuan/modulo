export interface CArrayFormatOptions {
  name: string;
  width: number;
  height: number;
  bytesPerLine?: number;
}

export function sanitizeIdentifier(value: string): string {
  const cleaned = value.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  const identifier = cleaned || 'bitmap';
  return /^[0-9]/.test(identifier) ? `image_${identifier}` : identifier;
}

export function makeHeaderFilename(fileName: string): string {
  return `${sanitizeIdentifier(fileName)}.h`;
}

export function formatCArray(bytes: Uint8Array, options: CArrayFormatOptions): string {
  const bytesPerLine = options.bytesPerLine ?? 16;
  const name = sanitizeIdentifier(options.name);
  const lines = [
    `// Resolution: ${options.width}x${options.height}, 1bpp`,
    `// Total bytes: ${bytes.length}`,
    `const uint8_t ${name}[] PROGMEM = {`
  ];

  for (let index = 0; index < bytes.length; index += bytesPerLine) {
    const chunk = Array.from(bytes.slice(index, index + bytesPerLine))
      .map((byte) => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`)
      .join(', ');
    lines.push(`  ${chunk}${index + bytesPerLine < bytes.length ? ',' : ''}`);
  }

  lines.push('};');
  return lines.join('\n');
}

export function makeTextBlob(source: string): Blob {
  return new Blob([source], { type: 'text/plain;charset=utf-8' });
}
