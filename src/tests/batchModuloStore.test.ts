import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBatchModuloStore } from '../features/batch/stores/batchModuloStore';

function makeImageData(inverted = false) {
  return new ImageData(
    new Uint8ClampedArray(inverted
      ? [
          255, 255, 255, 255,
          0, 0, 0, 255,
          0, 0, 0, 255,
          255, 255, 255, 255
        ]
      : [
          0, 0, 0, 255,
          255, 255, 255, 255,
          255, 255, 255, 255,
          0, 0, 0, 255
        ]),
    2,
    2
  );
}

describe('batchModuloStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('processes all queued images and creates merged output', async () => {
    const store = useBatchModuloStore();

    store.addImageData({ fileName: 'one.png', size: 4, type: 'image/png', imageData: makeImageData(false) });
    store.addImageData({ fileName: 'two.png', size: 4, type: 'image/png', imageData: makeImageData(true) });
    store.targetWidth = 2;
    store.targetHeight = 2;
    store.threshold = 128;
    store.dithering = 'none';

    await store.processAll();

    expect(store.items).toHaveLength(2);
    expect(store.summary.completed).toBe(2);
    expect(store.summary.failed).toBe(0);
    expect(store.items.every((item) => item.status === 'done')).toBe(true);
    expect(store.selectedItem?.source).toContain('const uint8_t one[] PROGMEM');
    expect(store.mergedSource).toContain('const uint8_t one[] PROGMEM');
    expect(store.mergedSource).toContain('const uint8_t two[] PROGMEM');
    expect(store.logs.some((line) => line.includes('Done one.png'))).toBe(true);
  });

  it('removes and retries queue items', async () => {
    const store = useBatchModuloStore();

    const item = store.addImageData({ fileName: 'retry.png', size: 4, type: 'image/png', imageData: makeImageData(false) });
    store.removeItem(item.id);
    expect(store.items).toHaveLength(0);

    const retry = store.addImageData({ fileName: 'retry.png', size: 4, type: 'image/png', imageData: makeImageData(false) });
    await store.retryItem(retry.id);

    expect(store.items[0].status).toBe('done');
    expect(store.items[0].progress).toBe(100);
  });
});
