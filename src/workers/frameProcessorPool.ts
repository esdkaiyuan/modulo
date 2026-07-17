import type { WorkerProcessRequest, WorkerProcessResult } from './frameProcessor.worker';
import { imageDataToGray, processGrayToBitmap } from '../engines/imageProcessor';
import { encodeBitmap } from '../engines/bitmapEncoder';
import { processImageDataToColor } from '../engines/colorProcessor';

interface Pending {
  req: WorkerProcessRequest;
  resolve: (r: WorkerProcessResult) => void;
  reject: (e: Error) => void;
}

/**
 * Pool of Web Workers for parallel frame processing.
 * Defaults to half the logical CPU count (min 1, max 8).
 */
export class FrameProcessorPool {
  private workers: Worker[] = [];
  private idle: number[] = [];          // indices of idle workers
  private queue: Pending[] = [];        // jobs waiting for a free worker
  private inflight = new Map<Worker, Pending>();
  private nextId = 0;

  constructor(concurrency = Math.min(8, Math.max(1, Math.floor((navigator.hardwareConcurrency ?? 2) / 2)))) {
    for (let i = 0; i < concurrency; i++) {
      const w = new Worker(new URL('./frameProcessor.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<WorkerProcessResult>) => {
        const p = this.inflight.get(w);
        this.inflight.delete(w);
        p?.resolve(e.data);
        this.dispatch(w);
      };
      w.onerror = (e) => {
        const p = this.inflight.get(w);
        this.inflight.delete(w);
        p?.reject(new Error(e.message ?? 'Worker error'));
        this.dispatch(w);
      };
      this.workers.push(w);
      this.idle.push(i);
    }
  }

  get concurrency() { return this.workers.length; }

  process(req: Omit<WorkerProcessRequest, 'id'>): Promise<WorkerProcessResult> {
    return new Promise((resolve, reject) => {
      const full: WorkerProcessRequest = { ...req, id: this.nextId++ };
      const pending: Pending = { req: full, resolve, reject };
      const idleIdx = this.idle.shift();
      if (idleIdx !== undefined) {
        this.send(this.workers[idleIdx], pending);
      } else {
        this.queue.push(pending);
      }
    });
  }

  private send(w: Worker, p: Pending) {
    this.inflight.set(w, p);
    w.postMessage(p.req);
  }

  private dispatch(w: Worker) {
    const next = this.queue.shift();
    if (next) {
      this.send(w, next);
    } else {
      this.idle.push(this.workers.indexOf(w));
    }
  }

  terminate() {
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    this.idle = [];
    this.queue = [];
    this.inflight.clear();
  }
}

let _pool: FrameProcessorPool | SyncFallbackPool | null = null;

/** Synchronous fallback used in test environments where Worker is unavailable. */
class SyncFallbackPool {
  get concurrency() { return 1; }
  process(req: Omit<WorkerProcessRequest, 'id'>): Promise<WorkerProcessResult> {
    if (req.colorMode && req.colorMode !== 'mono') {
      const { bytes, preview } = processImageDataToColor(req.imageData, {
        targetWidth: req.targetWidth,
        targetHeight: req.targetHeight,
        brightness: req.brightness,
        contrast: req.contrast,
        scalingAlgorithm: req.scalingAlgorithm,
        format: req.colorMode,
        byteOrder: req.colorByteOrder,
        dither: req.dither !== 'none',
      });
      return Promise.resolve({ id: 0, bitmap: new Uint8Array(), bytes, preview });
    }
    const gray = imageDataToGray(req.imageData);
    const bitmap = processGrayToBitmap(gray, {
      sourceWidth: req.imageData.width,
      sourceHeight: req.imageData.height,
      targetWidth: req.targetWidth,
      targetHeight: req.targetHeight,
      brightness: req.brightness,
      contrast: req.contrast,
      threshold: req.threshold,
      dither: req.dither,
      scalingAlgorithm: req.scalingAlgorithm,
    });
    const bytes = encodeBitmap(bitmap, req.targetWidth, req.targetHeight, {
      scan: req.scan,
      bitOrder: req.bitOrder,
      polarity: req.polarity,
    });
    return Promise.resolve({ id: 0, bitmap, bytes });
  }
  terminate() {}
}

export function getFrameProcessorPool(): FrameProcessorPool | SyncFallbackPool {
  if (!_pool) {
    _pool = typeof Worker !== 'undefined'
      ? new FrameProcessorPool()
      : new SyncFallbackPool();
  }
  return _pool;
}
