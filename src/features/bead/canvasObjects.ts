/** Free canvas object types. */
export type CanvasObjectType = 'pattern' | 'preset' | 'image';

/** Rotation in degrees. */
export interface CanvasObject {
  id: string;
  type: CanvasObjectType;
  /** Position on canvas (pixels from top-left) */
  x: number;
  y: number;
  /** Rotation in degrees (0-360) */
  rotation: number;
  /** Scale factor (1.0 = original size) */
  scale: number;
  /** Width in pixels (bounding box before rotation) */
  width: number;
  /** Height in pixels */
  height: number;
  /** Whether the object is currently selected */
  selected: boolean;
  /** Z-index for layering */
  zIndex: number;

  // Type-specific data
  /** For 'pattern' type: bead pattern data */
  patternData?: {
    width: number;
    height: number;
    cells: (string | null)[];
    brandId: string;
  };
  /** For 'preset' type: the preset ID */
  presetId?: string;
  /** For 'preset' type: the rendered SVG/emoji character */
  presetChar?: string;
  /** For 'preset' type: display color */
  presetColor?: string;
  /** For 'image' type: data URL */
  imageDataUrl?: string;
}

let _nextId = 1;

export function createCanvasObject(partial: Partial<CanvasObject> & { type: CanvasObjectType }): CanvasObject {
  return {
    id: `obj-${_nextId++}`,
    x: 100,
    y: 100,
    rotation: 0,
    scale: 1,
    width: 100,
    height: 100,
    selected: false,
    zIndex: 1,
    ...partial
  };
}
