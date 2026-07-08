import { decompressFrames, parseGIF } from 'gifuct-js';
import type { DecodedAnimationFrame } from '../stores/animationModuloStore';

interface GifFrame {
  dims: { left: number; top: number; width: number; height: number };
  delay?: number;
  patch: Uint8ClampedArray;
}

export interface DecodedGif {
  width: number;
  height: number;
  frames: DecodedAnimationFrame[];
}

export function decodeGif(buffer: ArrayBuffer): DecodedGif {
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true) as GifFrame[];
  const logicalWidth = gif.lsd.width;
  const logicalHeight = gif.lsd.height;
  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth;
  canvas.height = logicalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');

  const decoded = frames.map((frame) => {
    const patch = new Uint8ClampedArray(frame.patch);
    const image = new ImageData(patch, frame.dims.width, frame.dims.height);
    context.putImageData(image, frame.dims.left, frame.dims.top);
    return {
      imageData: context.getImageData(0, 0, logicalWidth, logicalHeight),
      delay: frame.delay ?? 100
    };
  });

  return {
    width: logicalWidth,
    height: logicalHeight,
    frames: decoded
  };
}
