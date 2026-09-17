import { imageDataToGray } from './imageProcessor';
import { sanitizeIdentifier } from './outputFormatter';

export interface FontRenderOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  width: number;
  height: number;
  /** Text color (default black) — used by color modes. */
  textColor?: string;
  /** Background color (default white) — used by color modes. */
  bgColor?: string;
}

export function fontImageDataToBitmap(imageData: ImageData, threshold: number, invert: boolean): Uint8Array {
  // Reuse the shared luminance + alpha compositing (single source of truth),
  // then apply the glyph direction: ink is dark, so darker-than-threshold is on.
  const gray = imageDataToGray(imageData);
  const bitmap = new Uint8Array(gray.length);

  for (let index = 0; index < gray.length; index += 1) {
    const on = gray[index] < threshold;
    bitmap[index] = invert ? (on ? 0 : 1) : (on ? 1 : 0);
  }

  return bitmap;
}

export function makeFontIdentifier(text: string, width: number, height: number): string {
  const ascii = /^[a-zA-Z0-9_]+$/.test(text);
  const textId = ascii
    ? sanitizeIdentifier(text)
    : Array.from(text || 'font').map((char) => `u${char.codePointAt(0)!.toString(16)}`).join('_');
  return `font_${textId}_${width}x${height}`;
}

/**
 * One C identifier per glyph. Repeated characters would otherwise produce the
 * same array name twice, which fails to compile, so later ones get a suffix.
 */
export function uniqueGlyphNames(chars: string[], width: number, height: number): string[] {
  const seen = new Map<string, number>();
  return chars.map((char) => {
    const base = makeFontIdentifier(char, width, height);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

export function fitFontSizeToBitmap(fontSize: number, width: number, height: number): number {
  return Math.max(1, Math.min(fontSize, Math.floor(Math.min(width, height) * 0.9)));
}

/** Ink bounds of the measured text, relative to the alignment point. */
export interface InkBox {
  /** Distance the ink extends left of the alignment point. */
  left: number;
  /** Distance the ink extends right of the alignment point. */
  right: number;
  ascent: number;
  descent: number;
}

export interface GlyphFit {
  /** Font size to render at — never larger than the requested size. */
  fontSize: number;
  /** Baseline x for `textAlign = 'left'`. */
  x: number;
  /** Baseline y for `textBaseline = 'alphabetic'`. */
  y: number;
}

/** Ink bounds from text metrics, with em-box estimates as a fallback. */
export function inkBoxOf(metrics: TextMetrics, fontSize: number): InkBox {
  const m = metrics as TextMetrics & {
    actualBoundingBoxLeft?: number;
    actualBoundingBoxRight?: number;
    actualBoundingBoxAscent?: number;
    actualBoundingBoxDescent?: number;
  };
  const finite = (value: number | undefined, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return {
    left: finite(m.actualBoundingBoxLeft, 0),
    right: finite(m.actualBoundingBoxRight, m.width || fontSize * 0.6),
    ascent: finite(m.actualBoundingBoxAscent, fontSize * 0.8),
    descent: finite(m.actualBoundingBoxDescent, fontSize * 0.2)
  };
}

/**
 * Fit a glyph into its cell and center its ink box. Only shrinks: the size the
 * user picked stays meaningful, but a wide or tall glyph is no longer clipped
 * by the cell (the old code sized the font from the em box, not the ink).
 */
export function fitGlyphToBox(ink: InkBox, requestedSize: number, boxWidth: number, boxHeight: number): GlyphFit {
  const inkWidth = Math.max(1e-6, ink.left + ink.right);
  const inkHeight = Math.max(1e-6, ink.ascent + ink.descent);
  const scale = Math.min(1, boxWidth / inkWidth, boxHeight / inkHeight);

  const left = ink.left * scale;
  const right = ink.right * scale;
  const ascent = ink.ascent * scale;
  const descent = ink.descent * scale;

  return {
    fontSize: Math.max(1, requestedSize * scale),
    x: (boxWidth - (right - left)) / 2,
    y: (boxHeight + ascent - descent) / 2
  };
}

export function renderTextToImageData(options: FontRenderOptions): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');

  context.clearRect(0, 0, options.width, options.height);
  context.fillStyle = options.bgColor ?? '#ffffff';
  context.fillRect(0, 0, options.width, options.height);
  context.fillStyle = options.textColor ?? '#000000';

  const text = options.text || ' ';
  const style = (size: number) =>
    `${options.italic ? 'italic ' : ''}${options.bold ? '700 ' : '400 '}${size}px ${options.fontFamily}`;

  const requested = fitFontSizeToBitmap(options.fontSize, options.width, options.height);
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.font = style(requested);

  const fit = fitGlyphToBox(
    inkBoxOf(context.measureText(text), requested),
    requested,
    options.width,
    options.height
  );
  context.font = style(fit.fontSize);
  context.fillText(text, fit.x, fit.y);

  return context.getImageData(0, 0, options.width, options.height);
}

export function renderTextToBitmap(options: FontRenderOptions, threshold: number, invert: boolean): Uint8Array {
  return fontImageDataToBitmap(renderTextToImageData(options), threshold, invert);
}
