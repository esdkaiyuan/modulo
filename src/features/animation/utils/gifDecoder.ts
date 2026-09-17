import { decompressFrames, parseGIF } from 'gifuct-js';
import type { DecodedAnimationFrame } from '../stores/animationModuloStore';

export interface GifFrameDims {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Frame data needed for compositing — DOM-free so it stays unit testable. */
export interface GifFrameInput {
  dims: GifFrameDims;
  patch: ArrayLike<number>;
  delay?: number;
  /** 0 = unspecified, 1 = keep, 2 = restore to background, 3 = restore to previous. */
  disposalType?: number;
}

interface GifFrame extends GifFrameInput {
  patch: Uint8ClampedArray;
}

export interface DecodedGif {
  width: number;
  height: number;
  frames: DecodedAnimationFrame[];
}

/** Copy a patch onto the buffer; transparent pixels keep whatever is underneath. */
function compositePatch(state: Uint8ClampedArray, frame: GifFrameInput, width: number, height: number): void {
  const { dims, patch } = frame;
  for (let y = 0; y < dims.height; y += 1) {
    const cy = dims.top + y;
    if (cy < 0 || cy >= height) continue;
    for (let x = 0; x < dims.width; x += 1) {
      const cx = dims.left + x;
      if (cx < 0 || cx >= width) continue;
      const si = (y * dims.width + x) * 4;
      if (patch[si + 3] === 0) continue;
      const di = (cy * width + cx) * 4;
      state[di] = patch[si];
      state[di + 1] = patch[si + 1];
      state[di + 2] = patch[si + 2];
      state[di + 3] = 255;
    }
  }
}

/** Clear a frame's rect — GIF disposal 2 restores that area to the background. */
function clearPatchRect(state: Uint8ClampedArray, dims: GifFrameDims, width: number, height: number): void {
  for (let y = 0; y < dims.height; y += 1) {
    const cy = dims.top + y;
    if (cy < 0 || cy >= height) continue;
    for (let x = 0; x < dims.width; x += 1) {
      const cx = dims.left + x;
      if (cx < 0 || cx >= width) continue;
      const di = (cy * width + cx) * 4;
      state[di] = 0;
      state[di + 1] = 0;
      state[di + 2] = 0;
      state[di + 3] = 0;
    }
  }
}

/**
 * Composite GIF frames honoring per-frame disposal. Frames are usually partial
 * patches, so without honoring disposal (and transparent holes) they smear over
 * the previous frame instead of replacing it. Returns one RGBA buffer per frame.
 */
export function compositeGifFrames(
  frames: GifFrameInput[],
  width: number,
  height: number
): Uint8ClampedArray<ArrayBuffer>[] {
  const state = new Uint8ClampedArray(width * height * 4);
  const buffers: Uint8ClampedArray<ArrayBuffer>[] = [];
  let pendingDisposal = 0;
  let pendingDims: GifFrameDims | null = null;
  let beforeFrame: Uint8ClampedArray<ArrayBuffer> | null = null;

  for (const frame of frames) {
    if (pendingDims) {
      if (pendingDisposal === 2) clearPatchRect(state, pendingDims, width, height);
      else if (pendingDisposal === 3 && beforeFrame) state.set(beforeFrame);
    }
    // Snapshot before drawing, so disposal 3 can undo this very frame later.
    beforeFrame = frame.disposalType === 3 ? new Uint8ClampedArray(state) : null;
    compositePatch(state, frame, width, height);
    buffers.push(new Uint8ClampedArray(state));
    pendingDisposal = frame.disposalType ?? 0;
    pendingDims = frame.dims;
  }

  return buffers;
}

export function decodeGif(buffer: ArrayBuffer): DecodedGif {
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true) as GifFrame[];
  const width = gif.lsd.width;
  const height = gif.lsd.height;
  const buffers = compositeGifFrames(frames, width, height);

  return {
    width,
    height,
    frames: buffers.map((rgba, index) => ({
      imageData: new ImageData(rgba, width, height),
      delay: frames[index]?.delay ?? 100
    }))
  };
}