export type PixelValue = string | null;

export function pixelsToBits(pixels: PixelValue[]): number[] {
  return pixels.map((pixel) => (pixel ? 1 : 0));
}

export function packBitsToBytes(bits: number[]): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(bits.length / 8));

  bits.forEach((bit, index) => {
    if (!bit) return;
    const byteIndex = Math.floor(index / 8);
    const bitIndex = 7 - (index % 8);
    bytes[byteIndex] |= 1 << bitIndex;
  });

  return bytes;
}

export function formatCArray(bytes: Uint8Array, width: number, height: number): string {
  const values = Array.from(bytes).map((byte) => `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`);
  const lines: string[] = [`const uint8_t image_${width}x${height}[] PROGMEM = {`];

  for (let i = 0; i < values.length; i += 16) {
    lines.push(`  ${values.slice(i, i + 16).join(', ')}${i + 16 < values.length ? ',' : ''}`);
  }

  lines.push('};');
  return lines.join('\n');
}

export function pixelsToCArray(pixels: PixelValue[], width: number, height: number): string {
  return formatCArray(packBitsToBytes(pixelsToBits(pixels)), width, height);
}
