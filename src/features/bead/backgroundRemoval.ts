// Simple canvas-based bg removal utilities.
// AI-based removal is loaded lazily (see removeBackgroundAi) to avoid
// bloating the initial bundle.

let aiModule: typeof import('@imgly/background-removal') | null = null;
let aiLoading = false;
let aiLoadError: string | null = null;

export async function loadAiRemoval(): Promise<boolean> {
  if (aiModule) return true;
  if (aiLoadError) return false;
  if (aiLoading) {
    // Wait for the existing load attempt
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (aiModule) { clearInterval(check); resolve(true); }
        else if (aiLoadError) { clearInterval(check); resolve(false); }
      }, 100);
    });
  }
  aiLoading = true;
  try {
    const mod = await import('@imgly/background-removal');
    aiModule = mod;
    return true;
  } catch (e: any) {
    aiLoadError = e?.message ?? 'Failed to load AI background removal';
    return false;
  } finally {
    aiLoading = false;
  }
}

export function isAiAvailable(): boolean {
  return aiModule !== null;
}

export function getAiLoadError(): string | null {
  return aiLoadError;
}

/**
 * Remove background from an image using AI (U2-Net).
 * Returns an ImageData with transparent background.
 *
 * @param source - Source image (HTMLImageElement, canvas, URL, etc.)
 * @param progress - Optional callback for progress (0-1)
 */
export async function removeBackgroundAi(
  source: HTMLImageElement | HTMLCanvasElement | string,
  progress?: (p: number) => void
): Promise<ImageData> {
  const ok = await loadAiRemoval();
  if (!ok || !aiModule) {
    throw new Error(aiLoadError ?? 'AI background removal not available');
  }

  const { removeBackground } = aiModule;

  // The library accepts various inputs; image / canvas / URL
  const blob = await removeBackground(source, {
    progress: (key, current, total) => {
      if (progress && total > 0) {
        progress(Math.min(1, current / total));
      }
    }
  });

  // Convert Blob → ImageData
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Simple color-based background removal (fast fallback).
 * Samples the background from the image borders and removes
 * pixels within a color distance threshold.
 */
export function removeBackgroundSimple(
  imageData: ImageData,
  mode: 'auto' | 'tolerance' | 'corner',
  tolerance: number
): ImageData {
  const { data, width: w, height: h } = imageData;
  const outData = new Uint8ClampedArray(data);

  // Determine background color
  let bgR = 255, bgG = 255, bgB = 255;
  if (mode === 'auto' || mode === 'corner') {
    const samples: { r: number; g: number; b: number }[] = [];
    // Sample top/bottom
    for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 40))) {
      const ti = x * 4;
      if (data[ti + 3] >= 128) samples.push({ r: data[ti], g: data[ti + 1], b: data[ti + 2] });
      const bi = ((h - 1) * w + x) * 4;
      if (data[bi + 3] >= 128) samples.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2] });
    }
    // Sample left/right
    for (let y = 1; y < h - 1; y += Math.max(1, Math.floor(h / 40))) {
      const li = (y * w) * 4;
      if (data[li + 3] >= 128) samples.push({ r: data[li], g: data[li + 1], b: data[li + 2] });
      const ri = (y * w + w - 1) * 4;
      if (data[ri + 3] >= 128) samples.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2] });
    }
    if (samples.length > 0) {
      let sr = 0, sg = 0, sb = 0;
      for (const s of samples) { sr += s.r; sg += s.g; sb += s.b; }
      bgR = Math.round(sr / samples.length);
      bgG = Math.round(sg / samples.length);
      bgB = Math.round(sb / samples.length);
    }
  }

  const tolSq = tolerance * tolerance * 3;

  if (mode === 'corner') {
    // Flood fill from edges
    const mask = new Uint8Array(w * h);
    const stack: number[] = [];

    function pushIfBg(x: number, y: number) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const idx = y * w + x;
      if (mask[idx]) return;
      const pi = idx * 4;
      if (outData[pi + 3] < 128) {
        mask[idx] = 1;
        stack.push(idx);
        return;
      }
      const dr = outData[pi] - bgR;
      const dg = outData[pi + 1] - bgG;
      const db = outData[pi + 2] - bgB;
      if (dr * dr + dg * dg + db * db <= tolSq) {
        mask[idx] = 1;
        stack.push(idx);
      }
    }

    const seeds: [number, number][] = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
      [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
      [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)]
    ];
    for (const [sx, sy] of seeds) pushIfBg(sx, sy);

    while (stack.length > 0) {
      const idx = stack.pop()!;
      const x = idx % w;
      const y = Math.floor(idx / w);
      pushIfBg(x + 1, y);
      pushIfBg(x - 1, y);
      pushIfBg(x, y + 1);
      pushIfBg(x, y - 1);
    }

    for (let i = 0; i < w * h; i++) {
      if (mask[i]) outData[i * 4 + 3] = 0;
    }
  } else {
    // Simple distance-based
    for (let i = 0; i < w * h; i++) {
      const pi = i * 4;
      if (outData[pi + 3] < 128) continue;
      const dr = outData[pi] - bgR;
      const dg = outData[pi + 1] - bgG;
      const db = outData[pi + 2] - bgB;
      if (dr * dr + dg * dg + db * db <= tolSq) {
        outData[pi + 3] = 0;
      }
    }
  }

  return new ImageData(outData, w, h);
}
