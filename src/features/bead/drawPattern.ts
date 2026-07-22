/** A drawable/editable bead cell for the hand-draw editor. */
export interface DrawBeadCell {
  row: number;
  col: number;
  /** Bead code from palette, or null for empty */
  beadCode: string | null;
}

/** A drawable pattern grid (mutable, for the editor). */
export interface DrawPattern {
  width: number;
  height: number;
  /** Flat array [row * width + col] → beadCode or null */
  cells: (string | null)[];
}

export function createDrawPattern(width: number, height: number, fill?: string | null): DrawPattern {
  return {
    width,
    height,
    cells: Array.from({ length: width * height }, () => fill ?? null)
  };
}

export function cloneDrawPattern(p: DrawPattern): DrawPattern {
  return { width: p.width, height: p.height, cells: [...p.cells] };
}

export function getDrawCell(p: DrawPattern, row: number, col: number): string | null {
  if (row < 0 || row >= p.height || col < 0 || col >= p.width) return null;
  return p.cells[row * p.width + col];
}

export function setDrawCell(p: DrawPattern, row: number, col: number, code: string | null): void {
  if (row < 0 || row >= p.height || col < 0 || col >= p.width) return;
  p.cells[row * p.width + col] = code;
}
