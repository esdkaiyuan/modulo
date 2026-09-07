import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const gradient = {
  addColorStop: vi.fn()
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  closePath: vi.fn(),
  createLinearGradient: vi.fn(() => gradient),
  createImageData: vi.fn((width: number, height: number) => ({
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4)
  })),
  drawImage: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  fillRect: vi.fn(),
  getImageData: vi.fn((x: number, y: number, width: number, height: number) => new ImageData(new Uint8ClampedArray(width * height * 4), width, height)),
  lineTo: vi.fn(),
  measureText: vi.fn(() => ({ width: 16 })),
  moveTo: vi.fn(),
  putImageData: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  setLineDash: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  font: '',
  globalAlpha: 1,
  shadowBlur: 0,
  shadowColor: '',
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

class TestIntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }

  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
globalThis.IntersectionObserver = TestIntersectionObserver as unknown as typeof IntersectionObserver;

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true)
  }))
});

// jsdom lacks FontFace / document.fonts (used by FontInputPanel upload)
if (!('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    value: { add: () => {}, delete: () => {}, load: () => Promise.resolve([]) }
  });
}
