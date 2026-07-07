import type { PixelValue } from './modulo';

export function floodFill(
  pixels: PixelValue[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  replacement: PixelValue
): PixelValue[] {
  const startIndex = startY * width + startX;
  const target = pixels[startIndex];

  if (target === replacement) {
    return [...pixels];
  }

  const result = [...pixels];
  const queue: Array<[number, number]> = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const index = y * width + x;
    if (result[index] !== target) continue;

    result[index] = replacement;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return result;
}
