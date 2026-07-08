import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  createImageData: vi.fn((width: number, height: number) => ({
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4)
  })),
  drawImage: vi.fn(),
  fillRect: vi.fn(),
  getImageData: vi.fn((x: number, y: number, width: number, height: number) => new ImageData(new Uint8ClampedArray(width * height * 4), width, height)),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  putImageData: vi.fn(),
  stroke: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1
})) as unknown as HTMLCanvasElement['getContext'];

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(data: Uint8ClampedArray, width: number, height?: number) {
    this.data = data;
    this.width = width;
    this.height = height ?? data.length / 4 / width;
  }
}

globalThis.ImageData = TestImageData as unknown as typeof ImageData;
