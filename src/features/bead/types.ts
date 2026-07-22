/** A single perler bead color from a manufacturer palette. */
export interface BeadColor {
  /** Manufacturer code, e.g. "S-01", "P-01", "H-01" */
  code: string;
  /** Human-readable name, e.g. "Bright Red" */
  name: string;
  /** sRGB hex, e.g. "#FF0000" */
  hex: string;
  /** Pre-computed RGB for fast distance matching */
  r: number;
  g: number;
  b: number;
  /** Brand-specific notes (e.g. "opaque", "translucent", "glow") */
  finish?: string;
}

export type BeadBrandId = 'artkal-s' | 'artkal-c' | 'perler' | 'hama-mini';

export interface BeadBrand {
  id: BeadBrandId;
  /** Display name */
  name: string;
  /** Default board size in beads (width × height) */
  defaultBoardSize: number;
  /** All available colors */
  colors: BeadColor[];
}

/** One cell in the generated pattern grid. */
export interface PatternCell {
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  col: number;
  /** Matched bead color (null = empty / no bead) */
  bead: BeadColor | null;
  /** Auto-assigned symbol for symbol-view mode */
  symbol: string;
}

/** The full generated pattern result. */
export interface PatternResult {
  /** Grid width in beads */
  width: number;
  /** Grid height in beads */
  height: number;
  /** Flat 2D array [row][col] */
  cells: (PatternCell | null)[][];
  /** Unique bead colors used, sorted by count desc */
  materials: MaterialItem[];
  /** Total bead count */
  totalBeads: number;
  /** Number of standard boards needed */
  boardCount: number;
  /** Board size used for calculation */
  boardSize: number;
  /** Brand used */
  brandId: BeadBrandId;
}

/** One entry in the materials / shopping list. */
export interface MaterialItem {
  bead: BeadColor;
  count: number;
  percentage: number;
  /** Symbol assigned to this color */
  symbol: string;
}

/** Settings that control pattern generation. */
export interface PatternSettings {
  brandId: BeadBrandId;
  gridWidth: number;
  gridHeight: number;
  boardSize: number;
  /** If true, lock aspect ratio when resizing grid */
  lockAspectRatio: boolean;
  /** Show symbols on beads */
  showSymbols: boolean;
  /** View mode: 'colors' | 'symbols' | 'both' */
  viewMode: 'colors' | 'symbols' | 'both';
}

/** Export format options. */
export type ExportFormat = 'png' | 'jpeg' | 'print' | 'csv' | 'json';
