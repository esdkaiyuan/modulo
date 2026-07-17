export type SizeMode = 'custom' | 'aspect';

export interface AspectSize {
  width: number;
  height: number;
}

/**
 * Derive target dimensions that preserve a source aspect ratio while fitting
 * inside a square bounding box of `longEdge` pixels. The longer source side maps
 * to `longEdge`; the shorter side scales down proportionally. Results are clamped
 * to at least 1px and rounded to whole pixels (dot-matrix panels are integer-sized).
 */
export function fitToAspect(sourceWidth: number, sourceHeight: number, longEdge: number): AspectSize {
  const edge = Math.max(1, Math.round(longEdge));
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width: edge, height: edge };
  }
  if (sourceWidth >= sourceHeight) {
    const height = Math.max(1, Math.round((edge * sourceHeight) / sourceWidth));
    return { width: edge, height };
  }
  const width = Math.max(1, Math.round((edge * sourceWidth) / sourceHeight));
  return { width, height: edge };
}

/** True when the given W×H already matches the source aspect ratio (within 1px rounding). */
export function matchesAspect(sourceWidth: number, sourceHeight: number, width: number, height: number): boolean {
  if (sourceWidth <= 0 || sourceHeight <= 0) return false;
  const longEdge = Math.max(width, height);
  const expected = fitToAspect(sourceWidth, sourceHeight, longEdge);
  return expected.width === width && expected.height === height;
}
