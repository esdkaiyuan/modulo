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
  fillText: vi.fn(),
  fillRect: vi.fn(),
  getImageData: vi.fn((x: number, y: number, width: number, height: number) => new ImageData(new Uint8ClampedArray(width * height * 4), width, height)),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  putImageData: vi.fn(),
  stroke: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic'
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

// jsdom lacks ResizeObserver (used by CropOverlay / ImageOutputPanel)
class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (TestResizeObserver as unknown as typeof ResizeObserver);

// jsdom lacks FontFace / document.fonts (used by FontInputPanel upload)
if (!('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    value: { add: () => {}, delete: () => {}, load: () => Promise.resolve([]) }
  });
}
