import { imageDataToGray, processGrayToBitmap, type DitherMode } from '../engines/imageProcessor';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../engines/bitmapEncoder';
import { processImageDataToColor, type ColorByteOrder, type ColorMode } from '../engines/colorProcessor';

export interface WorkerProcessRequest {
  id: number;
  imageData: ImageData;
  targetWidth: number;
  targetHeight: number;
  brightness: number;
  contrast: number;
  threshold: number;
  dither: DitherMode;
  scalingAlgorithm: 'nearest' | 'bilinear';
  scan: ScanDirection;
  bitOrder: BitOrder;
  polarity: Polarity;
  /** 'mono' (default) → 1bpp pipeline; otherwise the color pipeline. */
  colorMode?: ColorMode;
  colorByteOrder?: ColorByteOrder;
}

export interface WorkerProcessResult {
  id: number;
  /** Mono: 1bpp bitmap. Color: empty. */
  bitmap: Uint8Array;
  bytes: Uint8Array;
  /** Color only: quantized RGBA at target size for previews. */
  preview?: Uint8ClampedArray;
}

self.onmessage = (e: MessageEvent<WorkerProcessRequest>) => {
  const { id, imageData, targetWidth, targetHeight, brightness, contrast, threshold, dither, scalingAlgorithm, scan, bitOrder, polarity, colorMode, colorByteOrder } = e.data;

  if (colorMode && colorMode !== 'mono') {
    const { bytes, preview } = processImageDataToColor(imageData, {
      targetWidth,
      targetHeight,
      brightness,
      contrast,
      scalingAlgorithm,
      format: colorMode,
      byteOrder: colorByteOrder,
      dither: dither !== 'none'
    });
    const result: WorkerProcessResult = { id, bitmap: new Uint8Array(), bytes, preview };
    (postMessage as (msg: unknown, transfer: Transferable[]) => void)(result, [bytes.buffer, preview.buffer]);
    return;
  }

  const gray = imageDataToGray(imageData);
  const bitmap = processGrayToBitmap(gray, {
    sourceWidth: imageData.width,
    sourceHeight: imageData.height,
    targetWidth,
    targetHeight,
    brightness,
    contrast,
    threshold,
    dither,
    scalingAlgorithm
  });
  const bytes = encodeBitmap(bitmap, targetWidth, targetHeight, { scan, bitOrder, polarity });
  const result: WorkerProcessResult = { id, bitmap, bytes };
  (postMessage as (msg: unknown, transfer: Transferable[]) => void)(result, [bitmap.buffer, bytes.buffer]);
};
