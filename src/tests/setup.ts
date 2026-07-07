import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  stroke: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1
})) as unknown as HTMLCanvasElement['getContext'];
