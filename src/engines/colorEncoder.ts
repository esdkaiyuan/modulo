import type { ScanDirection } from './bitmapEncoder';
import type { EncodedModuloResult, ModuloMode, Rgb565ByteOrder, Rgb888Order } from '../features/shared/moduloTypes';

export interface ColorScanOptions {
  scan: ScanDirection;
}

export interface Palette16Result {
  pixelBytes: Uint8Array;
  paletteBytes: Uint8Array;
  indices: Uint8Array;
}

export interface EncodeColorImageOptions extends ColorScanOptions {
  rgb565ByteOrder: Rgb565ByteOrder;
  rgb888Order: Rgb888Order;
  background: string;
  palette?: Uint8Array;
}

type Rgb = [number, number, number];

export function scanPixelIndices(width: number, height: number, scan: ScanDirection): number[] {
  const indices: number[] = [];
  if (scan === 'horizontal-ltr') {
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) indices.push(y * width + x);
  } else if (scan === 'horizontal-rtl') {
    for (let y = 0; y < height; y += 1) for (let x = width - 1; x >= 0; x -= 1) indices.push(y * width + x);
  } else if (scan === 'vertical-ttb') {
    for (let x = 0; x < width; x += 1) for (let y = 0; y < height; y += 1) indices.push(y * width + x);
  } else {
    for (let x = 0; x < width; x += 1) for (let y = height - 1; y >= 0; y -= 1) indices.push(y * width + x);
  }
  return indices;
}

function parseHexColor(value: string): Rgb {
  const normalized = /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : 'FFFFFF';
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ];
}

function compositePixel(data: Uint8ClampedArray, index: number, background: Rgb): Rgb {
  const offset = index * 4;
  const alpha = data[offset + 3] / 255;
  const inverse = 1 - alpha;
  return [
    Math.round(data[offset] * alpha + background[0] * inverse),
    Math.round(data[offset + 1] * alpha + background[1] * inverse),
    Math.round(data[offset + 2] * alpha + background[2] * inverse)
  ];
}

export function rgbTo565(r: number, g: number, b: number): number {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

export function rgb565ToRgb(value: number): Rgb {
  const r5 = (value >> 11) & 0x1F;
  const g6 = (value >> 5) & 0x3F;
  const b5 = value & 0x1F;
  return [
    Math.round(r5 * 255 / 31),
    Math.round(g6 * 255 / 63),
    Math.round(b5 * 255 / 31)
  ];
}

export function encodeRgb565(
  image: ImageData,
  options: ColorScanOptions,
  order: Rgb565ByteOrder,
  background = '#FFFFFF'
): Uint8Array {
  const output = new Uint8Array(image.width * image.height * 2);
  const backgroundRgb = parseHexColor(background);
  scanPixelIndices(image.width, image.height, options.scan).forEach((sourceIndex, outputIndex) => {
    const [r, g, b] = compositePixel(image.data, sourceIndex, backgroundRgb);
    const value = rgbTo565(r, g, b);
    const high = value >> 8;
    const low = value & 0xFF;
    output[outputIndex * 2] = order === 'msb-first' ? high : low;
    output[outputIndex * 2 + 1] = order === 'msb-first' ? low : high;
  });
  return output;
}

export function encodeRgb888(
  image: ImageData,
  options: ColorScanOptions,
  order: Rgb888Order,
  background = '#FFFFFF'
): Uint8Array {
  const output = new Uint8Array(image.width * image.height * 3);
  const backgroundRgb = parseHexColor(background);
  scanPixelIndices(image.width, image.height, options.scan).forEach((sourceIndex, outputIndex) => {
    const [r, g, b] = compositePixel(image.data, sourceIndex, backgroundRgb);
    const offset = outputIndex * 3;
    output[offset] = order === 'rgb' ? r : b;
    output[offset + 1] = g;
    output[offset + 2] = order === 'rgb' ? b : r;
  });
  return output;
}

function emptyImageData(width: number, height: number): ImageData {
  return new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
}

export function decodeRgb565(
  bytes: Uint8Array,
  width: number,
  height: number,
  options: ColorScanOptions,
  order: Rgb565ByteOrder
): ImageData {
  const output = emptyImageData(width, height);
  scanPixelIndices(width, height, options.scan).forEach((destinationIndex, inputIndex) => {
    const first = bytes[inputIndex * 2] ?? 0;
    const second = bytes[inputIndex * 2 + 1] ?? 0;
    const value = order === 'msb-first' ? (first << 8) | second : (second << 8) | first;
    const [r, g, b] = rgb565ToRgb(value);
    output.data.set([r, g, b, 255], destinationIndex * 4);
  });
  return output;
}

export function decodeRgb888(
  bytes: Uint8Array,
  width: number,
  height: number,
  options: ColorScanOptions,
  order: Rgb888Order
): ImageData {
  const output = emptyImageData(width, height);
  scanPixelIndices(width, height, options.scan).forEach((destinationIndex, inputIndex) => {
    const offset = inputIndex * 3;
    const first = bytes[offset] ?? 0;
    const green = bytes[offset + 1] ?? 0;
    const third = bytes[offset + 2] ?? 0;
    output.data.set(order === 'rgb' ? [first, green, third, 255] : [third, green, first, 255], destinationIndex * 4);
  });
  return output;
}

interface ColorPoint extends Rgb {
  count: number;
}

function collectColors(images: ImageData[], background: Rgb): ColorPoint[] {
  const counts = new Map<string, ColorPoint>();
  for (const image of images) {
    for (let index = 0; index < image.width * image.height; index += 1) {
      const [r, g, b] = compositePixel(image.data, index, background);
      const key = `${r},${g},${b}`;
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, Object.assign([r, g, b] as Rgb, { count: 1 }));
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

function averageBucket(bucket: ColorPoint[]): Rgb {
  const total = bucket.reduce((sum, color) => sum + color.count, 0) || 1;
  return [0, 1, 2].map((channel) => Math.round(
    bucket.reduce((sum, color) => sum + color[channel] * color.count, 0) / total
  )) as Rgb;
}

function quantize(colors: ColorPoint[]): Rgb[] {
  if (colors.length <= 16) return colors.map(([r, g, b]) => [r, g, b]);
  const buckets: ColorPoint[][] = [colors];
  while (buckets.length < 16) {
    let splitIndex = -1;
    let splitRange = -1;
    for (let index = 0; index < buckets.length; index += 1) {
      const bucket = buckets[index];
      if (bucket.length < 2) continue;
      const ranges = [0, 1, 2].map((channel) => {
        const values = bucket.map((color) => color[channel]);
        return Math.max(...values) - Math.min(...values);
      });
      const range = Math.max(...ranges);
      if (range > splitRange) {
        splitRange = range;
        splitIndex = index;
      }
    }
    if (splitIndex < 0) break;
    const bucket = buckets.splice(splitIndex, 1)[0];
    const channel = [0, 1, 2].reduce((best, current) => {
      const range = (index: number) => Math.max(...bucket.map((color) => color[index])) - Math.min(...bucket.map((color) => color[index]));
      return range(current) > range(best) ? current : best;
    }, 0);
    bucket.sort((a, b) => a[channel] - b[channel]);
    const midpoint = Math.ceil(bucket.length / 2);
    buckets.push(bucket.slice(0, midpoint), bucket.slice(midpoint));
  }
  return buckets.map(averageBucket);
}

export function createPalette16(images: ImageData[], background = '#FFFFFF'): Uint8Array {
  const colors = quantize(collectColors(images, parseHexColor(background)));
  const palette = new Uint8Array(32);
  for (let index = 0; index < 16; index += 1) {
    const [r, g, b] = colors[index] ?? colors[0] ?? [0, 0, 0];
    const value = rgbTo565(r, g, b);
    palette[index * 2] = value >> 8;
    palette[index * 2 + 1] = value & 0xFF;
  }
  return palette;
}

function paletteColors(palette: Uint8Array): Rgb[] {
  return Array.from({ length: 16 }, (_, index) => rgb565ToRgb((palette[index * 2] << 8) | palette[index * 2 + 1]));
}

function closestColorIndex(color: Rgb, palette: Rgb[]): number {
  let closest = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  palette.forEach((candidate, index) => {
    const distance = (color[0] - candidate[0]) ** 2 + (color[1] - candidate[1]) ** 2 + (color[2] - candidate[2]) ** 2;
    if (distance < closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });
  return closest;
}

export function encodePalette16(
  image: ImageData,
  options: ColorScanOptions,
  palette = createPalette16([image]),
  background = '#FFFFFF'
): Palette16Result {
  const colors = paletteColors(palette);
  const backgroundRgb = parseHexColor(background);
  const scanned = scanPixelIndices(image.width, image.height, options.scan);
  const indices = Uint8Array.from(scanned, (sourceIndex) => closestColorIndex(compositePixel(image.data, sourceIndex, backgroundRgb), colors));
  const pixelBytes = new Uint8Array(Math.ceil(indices.length / 2));
  indices.forEach((paletteIndex, index) => {
    if (index % 2 === 0) pixelBytes[Math.floor(index / 2)] = paletteIndex << 4;
    else pixelBytes[Math.floor(index / 2)] |= paletteIndex;
  });
  return { pixelBytes, paletteBytes: new Uint8Array(palette), indices };
}

export function decodePalette16(
  pixelBytes: Uint8Array,
  palette: Uint8Array,
  width: number,
  height: number,
  options: ColorScanOptions
): ImageData {
  const output = emptyImageData(width, height);
  const colors = paletteColors(palette);
  scanPixelIndices(width, height, options.scan).forEach((destinationIndex, inputIndex) => {
    const packed = pixelBytes[Math.floor(inputIndex / 2)] ?? 0;
    const paletteIndex = inputIndex % 2 === 0 ? packed >> 4 : packed & 0x0F;
    output.data.set([...colors[paletteIndex], 255], destinationIndex * 4);
  });
  return output;
}

export function encodeColorImage(
  image: ImageData,
  mode: Exclude<ModuloMode, 'mono'>,
  options: EncodeColorImageOptions
): EncodedModuloResult {
  if (mode === 'rgb565') {
    const bytes = encodeRgb565(image, options, options.rgb565ByteOrder, options.background);
    return {
      mode,
      width: image.width,
      height: image.height,
      bytes,
      paletteBytes: new Uint8Array(),
      previewImageData: decodeRgb565(bytes, image.width, image.height, options, options.rgb565ByteOrder)
    };
  }
  if (mode === 'rgb888') {
    const bytes = encodeRgb888(image, options, options.rgb888Order, options.background);
    return {
      mode,
      width: image.width,
      height: image.height,
      bytes,
      paletteBytes: new Uint8Array(),
      previewImageData: decodeRgb888(bytes, image.width, image.height, options, options.rgb888Order)
    };
  }
  const encoded = encodePalette16(image, options, options.palette, options.background);
  return {
    mode,
    width: image.width,
    height: image.height,
    bytes: encoded.pixelBytes,
    paletteBytes: encoded.paletteBytes,
    previewImageData: decodePalette16(encoded.pixelBytes, encoded.paletteBytes, image.width, image.height, options)
  };
}
