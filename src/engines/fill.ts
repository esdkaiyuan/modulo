import type { PixelValue } from './modulo';

/**
 * Cells along the straight line between two points (Bresenham, both endpoints
 * included). Pointer events arrive far apart on fast drags, so painting only
 * the cell under the cursor leaves gaps in the stroke.
 */
export function lineCells(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const stepX = x0 < x1 ? 1 : -1;
  const stepY = y0 < y1 ? 1 : -1;
  let x = x0;
  let y = y0;
  let error = dx + dy;

  for (;;) {
    cells.push([x, y]);
    if (x === x1 && y === y1) break;
    const doubleError = 2 * error;
    if (doubleError >= dy) {
      error += dy;
      x += stepX;
    }
    if (doubleError <= dx) {
      error += dx;
      y += stepY;
    }
  }

  return cells;
}

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

  // Index cursor instead of shift(): shift() re-indexes the array on every call,
  // which turns a large fill into O(n²).
  for (let head = 0; head < queue.length; head += 1) {
    const [x, y] = queue[head];

    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const index = y * width + x;
    if (result[index] !== target) continue;

    result[index] = replacement;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return result;
}
