import { sanitizeIdentifier } from './outputFormatter';

export interface FontRenderOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  width: number;
  height: number;
}

export function fontImageDataToBitmap(imageData: ImageData, threshold: number, invert: boolean): Uint8Array {
  const bitmap = new Uint8Array(imageData.width * imageData.height);

  for (let index = 0; index < bitmap.length; index += 1) {
    const offset = index * 4;
    const alpha = imageData.data[offset + 3];
    const luminance = imageData.data[offset] * 0.299 + imageData.data[offset + 1] * 0.587 + imageData.data[offset + 2] * 0.114;
    const on = alpha > 0 && luminance < threshold;
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

export function fitFontSizeToBitmap(fontSize: number, width: number, height: number): number {
  return Math.max(1, Math.min(fontSize, Math.floor(Math.min(width, height) * 0.9)));
}

export function renderTextToImageData(options: FontRenderOptions): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');

  context.clearRect(0, 0, options.width, options.height);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, options.width, options.height);
  context.fillStyle = '#000000';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const fittedFontSize = fitFontSizeToBitmap(options.fontSize, options.width, options.height);
  context.font = `${options.italic ? 'italic ' : ''}${options.bold ? '700 ' : '400 '}${fittedFontSize}px ${options.fontFamily}`;
  context.fillText(options.text || ' ', options.width / 2, options.height / 2);

  return context.getImageData(0, 0, options.width, options.height);
}

export function renderTextToBitmap(options: FontRenderOptions, threshold: number, invert: boolean): Uint8Array {
  return fontImageDataToBitmap(renderTextToImageData(options), threshold, invert);
}

function parseColor(value: string): [number, number, number] {
  const color = /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : '000000';
  return [Number.parseInt(color.slice(0, 2), 16), Number.parseInt(color.slice(2, 4), 16), Number.parseInt(color.slice(4, 6), 16)];
}

export function colorizeFontImageData(
  source: ImageData,
  foregroundColor: string,
  backgroundColor: string,
  transparentBackground: boolean
): ImageData {
  const foreground = parseColor(foregroundColor);
  const background = parseColor(backgroundColor);
  const output = new ImageData(new Uint8ClampedArray(source.width * source.height * 4), source.width, source.height);
  for (let index = 0; index < source.width * source.height; index += 1) {
    const offset = index * 4;
    const luminance = source.data[offset] * 0.299 + source.data[offset + 1] * 0.587 + source.data[offset + 2] * 0.114;
    const coverage = source.data[offset + 3] / 255 * (1 - luminance / 255);
    if (transparentBackground) {
      output.data.set([...foreground, Math.round(coverage * 255)], offset);
    } else {
      output.data.set([
        Math.round(foreground[0] * coverage + background[0] * (1 - coverage)),
        Math.round(foreground[1] * coverage + background[1] * (1 - coverage)),
        Math.round(foreground[2] * coverage + background[2] * (1 - coverage)),
        255
      ], offset);
    }
  }
  return output;
}
