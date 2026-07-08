export type ScanDirection = 'horizontal-ltr' | 'horizontal-rtl' | 'vertical-ttb' | 'vertical-btt';
export type BitOrder = 'msb' | 'lsb';
export type Polarity = 'positive' | 'negative';

export interface BitmapEncodeOptions {
  scan: ScanDirection;
  bitOrder: BitOrder;
  polarity: Polarity;
}

function scanBitmap(bitmap: Uint8Array, width: number, height: number, scan: ScanDirection): number[] {
  const bits: number[] = [];

  if (scan === 'horizontal-ltr') {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) bits.push(bitmap[y * width + x]);
    }
  }

  if (scan === 'horizontal-rtl') {
    for (let y = 0; y < height; y += 1) {
      for (let x = width - 1; x >= 0; x -= 1) bits.push(bitmap[y * width + x]);
    }
  }

  if (scan === 'vertical-ttb') {
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) bits.push(bitmap[y * width + x]);
    }
  }

  if (scan === 'vertical-btt') {
    for (let x = 0; x < width; x += 1) {
      for (let y = height - 1; y >= 0; y -= 1) bits.push(bitmap[y * width + x]);
    }
  }

  return bits;
}

export function encodeBitmap(
  bitmap: Uint8Array,
  width: number,
  height: number,
  options: BitmapEncodeOptions
): Uint8Array {
  const bits = scanBitmap(bitmap, width, height, options.scan);
  const bytes = new Uint8Array(Math.ceil(bits.length / 8));

  bits.forEach((rawBit, index) => {
    const bit = options.polarity === 'negative' ? rawBit ^ 1 : rawBit;
    if (!bit) return;
    const byteIndex = Math.floor(index / 8);
    const bitIndex = options.bitOrder === 'msb' ? 7 - (index % 8) : index % 8;
    bytes[byteIndex] |= 1 << bitIndex;
  });

  return bytes;
}
