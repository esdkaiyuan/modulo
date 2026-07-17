export type ColorFormat = 'rgb565' | 'rgb888' | 'rgb332' | 'palette16';
export type ColorMode = 'mono' | ColorFormat;
export type ColorByteOrder = 'big' | 'little';

// Local copy — importing from imageProcessor would create a circular dependency.
function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export const PALETTE_16_COLORS: [number, number, number][] = [
  [0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 0],
  [0, 0, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255],
  [128, 0, 0], [0, 128, 0], [0, 0, 128], [128, 128, 0],
  [128, 0, 128], [0, 128, 128], [128, 128, 128], [64, 64, 64]
];

export const COLOR_FORMAT_INFO: Record<ColorFormat, { label: string; bytesPerPixel: number }> = {
  rgb565: { label: 'RGB565 (16-bit)', bytesPerPixel: 2 },
  rgb888: { label: 'RGB888 (24-bit)', bytesPerPixel: 3 },
  rgb332: { label: 'RGB332 (8-bit)', bytesPerPixel: 1 },
  palette16: { label: '16-Color Palette (4-bit index)', bytesPerPixel: 1 }
};

export interface ProcessColorOptions {
  targetWidth: number;
  targetHeight: number;
  brightness: number;
  contrast: number;
  scalingAlgorithm?: 'nearest' | 'bilinear';
  format: ColorFormat;
  byteOrder?: ColorByteOrder;
  dither?: boolean;
}

export interface ColorProcessResult {
  /** Encoded pixel data in the requested format (palette16: one index byte per pixel). */
  bytes: Uint8Array;
  /** Quantized RGBA pixels at target size, for canvas preview. */
  preview: Uint8ClampedArray;
}

export function rgbToRgb565(r: number, g: number, b: number): number {
  return ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
}

export function rgb565ToRgb(color: number): [number, number, number] {
  return [((color >> 11) & 0x1f) << 3, ((color >> 5) & 0x3f) << 2, (color & 0x1f) << 3];
}

export function rgbToRgb332(r: number, g: number, b: number): number {
  return ((r >> 5) << 5) | ((g >> 5) << 2) | (b >> 6);
}

export function rgb332ToRgb(color: number): [number, number, number] {
  // Expand via repetition so 0b111 maps back to 255, not 224.
  const r3 = (color >> 5) & 0x7;
  const g3 = (color >> 2) & 0x7;
  const b2 = color & 0x3;
  return [(r3 << 5) | (r3 << 2) | (r3 >> 1), (g3 << 5) | (g3 << 2) | (g3 >> 1), (b2 << 6) | (b2 << 4) | (b2 << 2) | b2];
}

export function findClosestPaletteColor(r: number, g: number, b: number, palette: [number, number, number][]): number {
  let minDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < palette.length; i++) {
    const dr = r - palette[i][0];
    const dg = g - palette[i][1];
    const db = b - palette[i][2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDist) {
      minDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** The 16-color palette encoded as RGB565 (2 bytes per color, byteOrder-aware). */
export function palette16Bytes(byteOrder: ColorByteOrder = 'big'): Uint8Array {
  const bytes = new Uint8Array(PALETTE_16_COLORS.length * 2);
  PALETTE_16_COLORS.forEach(([r, g, b], i) => {
    const value = rgbToRgb565(r, g, b);
    if (byteOrder === 'big') {
      bytes[i * 2] = (value >> 8) & 0xff;
      bytes[i * 2 + 1] = value & 0xff;
    } else {
      bytes[i * 2] = value & 0xff;
      bytes[i * 2 + 1] = (value >> 8) & 0xff;
    }
  });
  return bytes;
}

// ── RGBA-domain resize (both algorithms operate per channel) ──

function resizeRgbaNearest(src: Uint8ClampedArray, sw: number, sh: number, tw: number, th: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(tw * th * 4);
  const xRatio = sw / tw;
  const yRatio = sh / th;
  for (let y = 0; y < th; y += 1) {
    const srcY = Math.min(sh - 1, Math.floor(y * yRatio));
    for (let x = 0; x < tw; x += 1) {
      const srcX = Math.min(sw - 1, Math.floor(x * xRatio));
      const si = (srcY * sw + srcX) * 4;
      const di = (y * tw + x) * 4;
      result[di] = src[si];
      result[di + 1] = src[si + 1];
      result[di + 2] = src[si + 2];
      result[di + 3] = src[si + 3];
    }
  }
  return result;
}

function resizeRgbaBilinear(src: Uint8ClampedArray, sw: number, sh: number, tw: number, th: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(tw * th * 4);
  const xRatio = (sw - 1) / Math.max(1, tw - 1);
  const yRatio = (sh - 1) / Math.max(1, th - 1);
  for (let y = 0; y < th; y += 1) {
    const srcY = Math.min(sh - 1.001, y * yRatio);
    const y0 = Math.floor(srcY);
    const y1 = Math.min(y0 + 1, sh - 1);
    const yFrac = srcY - y0;
    for (let x = 0; x < tw; x += 1) {
      const srcX = Math.min(sw - 1.001, x * xRatio);
      const x0 = Math.floor(srcX);
      const x1 = Math.min(x0 + 1, sw - 1);
      const xFrac = srcX - x0;
      const di = (y * tw + x) * 4;
      for (let c = 0; c < 4; c += 1) {
        const v00 = src[(y0 * sw + x0) * 4 + c];
        const v10 = src[(y0 * sw + x1) * 4 + c];
        const v01 = src[(y1 * sw + x0) * 4 + c];
        const v11 = src[(y1 * sw + x1) * 4 + c];
        const top = v00 + (v10 - v00) * xFrac;
        const bottom = v01 + (v11 - v01) * xFrac;
        result[di + c] = clampByte(top + (bottom - top) * yFrac);
      }
    }
  }
  return result;
}

/** Per-format channel quantization used for both output and dither targets. */
function quantizeChannelValues(format: ColorFormat, r: number, g: number, b: number): [number, number, number] {
  if (format === 'rgb565') return rgb565ToRgb(rgbToRgb565(r, g, b));
  if (format === 'rgb332') return rgb332ToRgb(rgbToRgb332(r, g, b));
  if (format === 'palette16') return PALETTE_16_COLORS[findClosestPaletteColor(r, g, b, PALETTE_16_COLORS)];
  return [r, g, b]; // rgb888 is lossless
}

/**
 * Full color pipeline: resize → brightness/contrast → (optional FS dither) →
 * quantize → encode. Transparent pixels composite onto white, matching the
 * mono pipeline's treatment.
 */
export function processImageDataToColor(imageData: ImageData, options: ProcessColorOptions): ColorProcessResult {
  const { targetWidth: tw, targetHeight: th, format } = options;
  const byteOrder = options.byteOrder ?? 'big';

  const resizeFn = options.scalingAlgorithm === 'bilinear' ? resizeRgbaBilinear : resizeRgbaNearest;
  const resized = resizeFn(imageData.data, imageData.width, imageData.height, tw, th);

  // Brightness/contrast per RGB channel + alpha compositing onto white.
  const pixelCount = tw * th;
  const rgb = new Float32Array(pixelCount * 3);
  for (let i = 0; i < pixelCount; i += 1) {
    const si = i * 4;
    const alpha = resized[si + 3] / 255;
    for (let c = 0; c < 3; c += 1) {
      const composited = resized[si + c] * alpha + 255 * (1 - alpha);
      rgb[i * 3 + c] = (composited - 128) * options.contrast + 128 + options.brightness;
    }
  }

  const preview = new Uint8ClampedArray(pixelCount * 4);
  const bpp = COLOR_FORMAT_INFO[format].bytesPerPixel;
  const bytes = new Uint8Array(pixelCount * bpp);

  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const i = y * tw + x;
      const r = clampByte(rgb[i * 3]);
      const g = clampByte(rgb[i * 3 + 1]);
      const b = clampByte(rgb[i * 3 + 2]);
      const [qr, qg, qb] = quantizeChannelValues(format, r, g, b);

      // Floyd-Steinberg on RGB channels against the quantized value.
      if (options.dither && format !== 'rgb888') {
        const errors = [r - qr, g - qg, b - qb];
        for (let c = 0; c < 3; c += 1) {
          const err = errors[c];
          if (x + 1 < tw) rgb[(i + 1) * 3 + c] += err * 7 / 16;
          if (x > 0 && y + 1 < th) rgb[(i + tw - 1) * 3 + c] += err * 3 / 16;
          if (y + 1 < th) rgb[(i + tw) * 3 + c] += err * 5 / 16;
          if (x + 1 < tw && y + 1 < th) rgb[(i + tw + 1) * 3 + c] += err * 1 / 16;
        }
      }

      preview[i * 4] = qr;
      preview[i * 4 + 1] = qg;
      preview[i * 4 + 2] = qb;
      preview[i * 4 + 3] = 255;

      if (format === 'rgb565') {
        const value = rgbToRgb565(r, g, b);
        if (byteOrder === 'big') {
          bytes[i * 2] = (value >> 8) & 0xff;
          bytes[i * 2 + 1] = value & 0xff;
        } else {
          bytes[i * 2] = value & 0xff;
          bytes[i * 2 + 1] = (value >> 8) & 0xff;
        }
      } else if (format === 'rgb888') {
        bytes[i * 3] = r;
        bytes[i * 3 + 1] = g;
        bytes[i * 3 + 2] = b;
      } else if (format === 'rgb332') {
        bytes[i] = rgbToRgb332(r, g, b);
      } else {
        bytes[i] = findClosestPaletteColor(r, g, b, PALETTE_16_COLORS);
      }
    }
  }

  return { bytes, preview };
}
