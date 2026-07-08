import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useImageModuloStore } from '../features/image/stores/imageModuloStore';

describe('imageModuloStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('processes loaded image data into bitmap, bytes, and C source', () => {
    const store = useImageModuloStore();
    const image = new ImageData(
      new Uint8ClampedArray([
        0, 0, 0, 255,
        255, 255, 255, 255,
        255, 255, 255, 255,
        0, 0, 0, 255
      ]),
      2,
      2
    );

    store.loadImageData({
      fileName: 'sample image.png',
      width: 2,
      height: 2,
      size: 4,
      type: 'image/png',
      imageData: image
    });
    store.targetWidth = 2;
    store.targetHeight = 2;
    store.threshold = 128;
    store.dithering = 'none';
    store.process();

    expect(Array.from(store.bitmap)).toEqual([0, 1, 1, 0]);
    expect(Array.from(store.bytes)).toEqual([0x60]);
    expect(store.generatedSource).toContain('const uint8_t sample_image[] PROGMEM');
    expect(store.totalBits).toBe(4);
  });
});
