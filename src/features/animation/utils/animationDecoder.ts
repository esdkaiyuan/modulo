import { decodeGif, type DecodedGif } from './gifDecoder';
import type { DecodedAnimationFrame } from '../stores/animationModuloStore';

export type DecodedAnimation = DecodedGif;

const DEFAULT_FRAME_DELAY = 100; // ms, for static images / frames without timing

export const ANIMATION_ACCEPT = 'image/gif,image/png,image/apng,image/jpeg,image/webp,image/bmp';

// WebCodecs ImageDecoder (Chrome/Edge) — minimal typings, absent from some TS libs.
interface ImageDecoderLike {
  tracks: { ready: Promise<void>; selectedTrack: { frameCount: number } | null };
  completed: Promise<void>;
  decode(options: { frameIndex: number }): Promise<{ image: CanvasImageSource & { duration: number | null; close(): void } }>;
  close(): void;
}
interface ImageDecoderCtor {
  new (init: { data: ArrayBuffer; type: string }): ImageDecoderLike;
  isTypeSupported(type: string): Promise<boolean>;
}

function getImageDecoder(): ImageDecoderCtor | null {
  return typeof window !== 'undefined' && 'ImageDecoder' in window
    ? (window as unknown as { ImageDecoder: ImageDecoderCtor }).ImageDecoder
    : null;
}

function resolveType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  const byExt: Record<string, string> = {
    gif: 'image/gif',
    png: 'image/png',
    apng: 'image/apng',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    bmp: 'image/bmp'
  };
  return byExt[ext] ?? '';
}

// Chat apps often save GIF/APNG stickers with a .jpg/.png name, so the
// extension and File.type lie. Sniff the real container from magic bytes.
function sniffType(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...bytes.subarray(offset, offset + length));
  const hasChunk = (tag: string) => {
    // Scan for a 4-byte chunk tag (acTL / ANIM live near the file start)
    const limit = Math.min(bytes.length - 4, 4096);
    for (let i = 8; i < limit; i += 1) {
      if (bytes[i] === tag.charCodeAt(0) && ascii(i, 4) === tag) return true;
    }
    return false;
  };

  if (bytes.length >= 6 && ascii(0, 4) === 'GIF8') return 'image/gif';
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(1, 3) === 'PNG') {
    return hasChunk('acTL') ? 'image/apng' : 'image/png';
  }
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 2 && ascii(0, 2) === 'BM') return 'image/bmp';
  return '';
}

function make2dContext(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');
  return context;
}

// Multi-frame decode via WebCodecs — covers APNG and animated WebP.
async function decodeWithImageDecoder(buffer: ArrayBuffer, type: string): Promise<DecodedAnimation | null> {
  const ImageDecoder = getImageDecoder();
  if (!ImageDecoder || !(await ImageDecoder.isTypeSupported(type).catch(() => false))) return null;

  const decoder = new ImageDecoder({ data: buffer, type });
  try {
    await decoder.tracks.ready;
    await decoder.completed;
    const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0;
    if (!frameCount) return null;

    const frames: DecodedAnimationFrame[] = [];
    let context: CanvasRenderingContext2D | null = null;
    for (let index = 0; index < frameCount; index += 1) {
      const { image } = await decoder.decode({ frameIndex: index });
      const width = (image as unknown as { displayWidth: number }).displayWidth;
      const height = (image as unknown as { displayHeight: number }).displayHeight;
      if (!context) context = make2dContext(width, height);
      context.drawImage(image, 0, 0);
      frames.push({
        imageData: context.getImageData(0, 0, context.canvas.width, context.canvas.height),
        delay: image.duration ? Math.round(image.duration / 1000) : DEFAULT_FRAME_DELAY
      });
      image.close();
    }
    if (!context) return null;
    return { width: context.canvas.width, height: context.canvas.height, frames };
  } finally {
    decoder.close();
  }
}

// Single-frame decode for static formats (png/jpg/webp/bmp) and as a fallback.
async function decodeStaticImage(file: File): Promise<DecodedAnimation> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to decode image'));
      image.src = url;
    });
    const context = make2dContext(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, 0, 0);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      frames: [{
        imageData: context.getImageData(0, 0, image.naturalWidth, image.naturalHeight),
        delay: DEFAULT_FRAME_DELAY
      }]
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Decode an animation source file into frames.
 * The container is sniffed from magic bytes first — a "sticker.jpg" that is
 * really an animated GIF/APNG decodes with all frames — falling back to the
 * declared MIME type / extension when the bytes are unrecognized.
 * - GIF → gifuct-js (all frames)
 * - APNG/animated WebP → WebCodecs ImageDecoder when available (all frames), else static fallback
 * - PNG/JPG/BMP and anything else the browser can render → single frame
 */
export async function decodeAnimationFile(file: File): Promise<DecodedAnimation> {
  const buffer = await file.arrayBuffer();
  const type = sniffType(buffer) || resolveType(file);
  if (type === 'image/gif') {
    return decodeGif(buffer);
  }
  if (type === 'image/apng' || type === 'image/webp') {
    const decoded = await decodeWithImageDecoder(buffer, type === 'image/apng' ? 'image/png' : type)
      .catch(() => null);
    if (decoded) return decoded;
  }
  return decodeStaticImage(file);
}
