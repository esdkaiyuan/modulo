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

export function formatRgb565Array(data: Uint8Array, options: CArrayFormatOptions): string {
  const name = sanitizeIdentifier(options.name);
  const lines = [
    `// Resolution: ${options.width}x${options.height}, RGB565 (16-bit color)`,
    `// Total pixels: ${data.length / 2}`,
    `const uint16_t ${name}[] PROGMEM = {`
  ];

  for (let index = 0; index < data.length; index += 16) {
    const chunk = [];
    for (let i = index; i < index + 16 && i + 1 < data.length; i += 2) {
      const val = (data[i] << 8) | data[i + 1];
      chunk.push(`0x${val.toString(16).padStart(4, '0').toUpperCase()}`);
    }
    lines.push(`  ${chunk.join(', ')}${index + 16 < data.length ? ',' : ''}`);
  }

  lines.push('};');
  return lines.join('\n');
}

export function formatPalette16Array(palette: Uint8Array, indices: Uint8Array, options: CArrayFormatOptions): string {
  const name = sanitizeIdentifier(options.name);
  const paletteColors: string[] = [];
  for (let i = 0; i < palette.length; i += 2) {
    const val = (palette[i] << 8) | palette[i + 1];
    paletteColors.push(`0x${val.toString(16).padStart(4, '0').toUpperCase()}`);
  }

  const lines = [
    `// Resolution: ${options.width}x${options.height}, 16-color palette (RGB565)`,
    `// Palette (16 colors):`,
    `const uint16_t ${name}_palette[] PROGMEM = {`,
    `  ${paletteColors.join(', ')}`,
    `};`,
    ``,
    `// Pixel indices:`,
    `const uint8_t ${name}[] PROGMEM = {`
  ];

  for (let index = 0; index < indices.length; index += 16) {
    const chunk = Array.from(indices.slice(index, index + 16))
      .map((idx) => `0x${idx.toString(16).padStart(1, '0').toUpperCase()}`)
      .join(', ');
    lines.push(`  ${chunk}${index + 16 < indices.length ? ',' : ''}`);
  }

  lines.push('};');
  return lines.join('\n');
}
