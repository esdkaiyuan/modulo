export type DitherMode = 'none' | 'floyd-steinberg';

export interface ProcessImageOptions {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  brightness: number;
  contrast: number;
  threshold: number;
  dither: DitherMode;
}

export function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function imageDataToGray(imageData: ImageData): Uint8ClampedArray {
  const result = new Uint8ClampedArray(imageData.width * imageData.height);

  for (let i = 0; i < result.length; i += 1) {
    const offset = i * 4;
    const alpha = imageData.data[offset + 3];

    if (alpha === 0) {
      result[i] = 255;
      continue;
    }

    result[i] = clampByte(
      imageData.data[offset] * 0.299 +
      imageData.data[offset + 1] * 0.587 +
      imageData.data[offset + 2] * 0.114
    );
  }

  return result;
}

export function adjustGray(value: number, brightness: number, contrast: number): number {
  return clampByte((value - 128) * contrast + 128 + brightness);
}

export function applyAdjustments(gray: Uint8ClampedArray, brightness: number, contrast: number): Uint8ClampedArray {
  return Uint8ClampedArray.from(gray, (value) => adjustGray(value, brightness, contrast));
}

export function resizeNearest(
  gray: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(targetWidth * targetHeight);

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.floor((y / targetHeight) * sourceHeight));
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor((x / targetWidth) * sourceWidth));
      result[y * targetWidth + x] = gray[sourceY * sourceWidth + sourceX];
    }
  }

  return result;
}

export function thresholdGray(gray: Uint8ClampedArray, threshold: number): Uint8Array {
  return Uint8Array.from(gray, (value) => (value >= threshold ? 1 : 0));
}

export function floydSteinbergDither(gray: Uint8ClampedArray, width: number, height: number, threshold: number): Uint8Array {
  const values = Float32Array.from(gray);
  const bitmap = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldValue = values[index];
      const newValue = oldValue >= threshold ? 255 : 0;
      bitmap[index] = newValue === 255 ? 1 : 0;

      const error = oldValue - newValue;
      if (x + 1 < width) values[index + 1] += error * 7 / 16;
      if (x > 0 && y + 1 < height) values[index + width - 1] += error * 3 / 16;
      if (y + 1 < height) values[index + width] += error * 5 / 16;
      if (x + 1 < width && y + 1 < height) values[index + width + 1] += error * 1 / 16;
    }
  }

  return bitmap;
}

export function processGrayToBitmap(gray: Uint8ClampedArray, options: ProcessImageOptions): Uint8Array {
  const resized = resizeNearest(gray, options.sourceWidth, options.sourceHeight, options.targetWidth, options.targetHeight);
  const adjusted = applyAdjustments(resized, options.brightness, options.contrast);

  if (options.dither === 'floyd-steinberg') {
    return floydSteinbergDither(adjusted, options.targetWidth, options.targetHeight, options.threshold);
  }

  return thresholdGray(adjusted, options.threshold);
}

export function imageDataToBitmap(imageData: ImageData, options: Omit<ProcessImageOptions, 'sourceWidth' | 'sourceHeight'>): Uint8Array {
  return processGrayToBitmap(imageDataToGray(imageData), {
    ...options,
    sourceWidth: imageData.width,
    sourceHeight: imageData.height
  });
}
