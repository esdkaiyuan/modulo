import type { BeadBrand, BeadColor, MaterialItem, PatternCell, PatternResult, PatternSettings } from './types';
import { getBrand, getSymbol } from './paletteData';

/** Euclidean distance in RGB space — fast and good enough for bead matching. */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

/** Find the closest bead color to a given RGB value. */
export function findClosestBead(
  r: number,
  g: number,
  b: number,
  palette: BeadColor[],
  exclude?: Set<string>
): BeadColor {
  let best = palette[0];
  let bestDist = Infinity;
  for (const bead of palette) {
    if (exclude?.has(bead.code)) continue;
    const dist = colorDistance(r, g, b, bead.r, bead.g, bead.b);
    if (dist < bestDist) {
      bestDist = dist;
      best = bead;
    }
  }
  return best;
}

/** Resize image data to target width×height using nearest-neighbor sampling. */
function resizeImageNearest(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  tgtW: number,
  tgtH: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(tgtW * tgtH * 4);
  const xRatio = srcW / tgtW;
  const yRatio = srcH / tgtH;
  for (let ty = 0; ty < tgtH; ty++) {
    const sy = Math.min(srcH - 1, Math.floor(ty * yRatio));
    for (let tx = 0; tx < tgtW; tx++) {
      const sx = Math.min(srcW - 1, Math.floor(tx * xRatio));
      const si = (sy * srcW + sx) * 4;
      const di = (ty * tgtW + tx) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  return out;
}

/** Compute the dominant background color by sampling border pixels. */
function sampleBackgroundColor(
  data: Uint8ClampedArray,
  w: number,
  h: number
): { r: number; g: number; b: number } {
  const samples: { r: number; g: number; b: number }[] = [];
  // Sample top + bottom rows
  for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 40))) {
    const ti = x * 4;
    if (data[ti + 3] >= 128) samples.push({ r: data[ti], g: data[ti + 1], b: data[ti + 2] });
    const bi = ((h - 1) * w + x) * 4;
    if (data[bi + 3] >= 128) samples.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2] });
  }
  // Sample left + right columns
  for (let y = 1; y < h - 1; y += Math.max(1, Math.floor(h / 40))) {
    const li = (y * w) * 4;
    if (data[li + 3] >= 128) samples.push({ r: data[li], g: data[li + 1], b: data[li + 2] });
    const ri = (y * w + w - 1) * 4;
    if (data[ri + 3] >= 128) samples.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2] });
  }
  if (samples.length === 0) return { r: 255, g: 255, b: 255 };
  // Average of samples
  let sr = 0, sg = 0, sb = 0;
  for (const s of samples) { sr += s.r; sg += s.g; sb += s.b; }
  return { r: Math.round(sr / samples.length), g: Math.round(sg / samples.length), b: Math.round(sb / samples.length) };
}

/**
 * Flood-fill from corners to detect background region.
 * Returns a boolean mask (true = background / empty).
 */
function cornerFloodMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  bgColor: { r: number; g: number; b: number },
  tolerance: number
): Uint8Array {
  const mask = new Uint8Array(w * h);
  const tolSq = tolerance * tolerance * 3;
  const stack: number[] = [];

  // Start from all 4 corners and edge midpoints
  const seeds = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
    [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)]
  ];

  function pushIfBg(x: number, y: number) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = y * w + x;
    if (mask[idx]) return;
    const pi = idx * 4;
    if (data[pi + 3] < 128) {
      mask[idx] = 1;
      stack.push(idx);
      return;
    }
    const dr = data[pi] - bgColor.r;
    const dg = data[pi + 1] - bgColor.g;
    const db = data[pi + 2] - bgColor.b;
    if (dr * dr + dg * dg + db * db <= tolSq) {
      mask[idx] = 1;
      stack.push(idx);
    }
  }

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

  return mask;
}

/**
 * Generate a perler bead pattern from an image's ImageData.
 *
 * @param imageData - Source image pixel data (RGBA)
 * @param settings - Pattern generation settings
 * @param excludeColors - Set of bead codes to exclude from matching
 * @returns The full pattern result with grid, materials, and board count
 */
export function generatePattern(
  imageData: ImageData,
  settings: PatternSettings,
  excludeColors?: Set<string>
): PatternResult {
  const brand = getBrand(settings.brandId);
  const { gridWidth: w, gridHeight: h, boardSize } = settings;

  // Resize source image to grid dimensions
  const resized = resizeImageNearest(
    imageData.data,
    imageData.width,
    imageData.height,
    w,
    h
  );

  // Compute background color for removal
  let bgColor: { r: number; g: number; b: number } | null = null;
  let bgMask: Uint8Array | null = null;
  if (settings.bgRemoveMode === 'auto' || settings.bgRemoveMode === 'corner') {
    bgColor = sampleBackgroundColor(resized, w, h);
    if (settings.bgRemoveMode === 'corner') {
      bgMask = cornerFloodMask(resized, w, h, bgColor, settings.bgTolerance);
      bgColor = null; // use mask instead of simple distance
    }
  } else if (settings.bgRemoveMode === 'tolerance') {
    bgColor = { r: 255, g: 255, b: 255 }; // white background by default
  }

  // Match each pixel to closest bead color
  const cells: (PatternCell | null)[][] = [];
  const beadCounts = new Map<string, { bead: BeadColor; count: number }>();
  let totalBeads = 0;

  for (let row = 0; row < h; row++) {
    const rowCells: (PatternCell | null)[] = [];
    for (let col = 0; col < w; col++) {
      const idx = (row * w + col) * 4;
      const r = resized[idx];
      const g = resized[idx + 1];
      const b = resized[idx + 2];
      const a = resized[idx + 3];

      // Transparent pixels become empty
      if (a < 128) {
        rowCells.push(null);
        continue;
      }

      // Background removal check
      if (bgMask && bgMask[row * w + col]) {
        rowCells.push(null);
        continue;
      }
      if (bgColor) {
        const tolSq = settings.bgTolerance * settings.bgTolerance * 3;
        const dr = r - bgColor.r;
        const dg = g - bgColor.g;
        const db = b - bgColor.b;
        if (dr * dr + dg * dg + db * db <= tolSq) {
          rowCells.push(null);
          continue;
        }
      }

      const matched = findClosestBead(r, g, b, brand.colors, excludeColors);

      const existing = beadCounts.get(matched.code);
      if (existing) {
        existing.count++;
      } else {
        beadCounts.set(matched.code, { bead: matched, count: 1 });
      }
      totalBeads++;

      rowCells.push({
        row,
        col,
        bead: matched,
        symbol: '' // assigned below
      });
    }
    cells.push(rowCells);
  }

  // Sort materials by count descending and assign symbols
  const materials: MaterialItem[] = Array.from(beadCounts.values())
    .sort((a, b) => b.count - a.count)
    .map((entry, i) => ({
      bead: entry.bead,
      count: entry.count,
      percentage: totalBeads > 0 ? (entry.count / totalBeads) * 100 : 0,
      symbol: getSymbol(i)
    }));

  // Assign symbols back to cells
  const codeToSymbol = new Map<string, string>();
  for (const m of materials) {
    codeToSymbol.set(m.bead.code, m.symbol);
  }
  for (const row of cells) {
    for (const cell of row) {
      if (cell?.bead) {
        cell.symbol = codeToSymbol.get(cell.bead.code) ?? '?';
      }
    }
  }

  // Calculate board count
  const beadsPerBoard = boardSize * boardSize;
  const boardCount = Math.ceil(totalBeads / beadsPerBoard);

  return {
    width: w,
    height: h,
    cells,
    materials,
    totalBeads,
    boardCount,
    boardSize,
    brandId: settings.brandId
  };
}

/** Count beads on the current board area (standard 29×29). */
export function getBoardGrid(width: number, height: number, boardSize: number): { cols: number; rows: number } {
  return {
    cols: Math.ceil(width / boardSize),
    rows: Math.ceil(height / boardSize)
  };
}
