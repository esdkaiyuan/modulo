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

  it('encodes the cropped target-sized image in RGB888 mode', () => {
    const store = useImageModuloStore();
    const image = new ImageData(new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255,
      0, 0, 255, 255, 255, 255, 255, 255
    ]), 2, 2);
    store.loadImageData({ fileName: 'crop.png', width: 2, height: 2, size: 16, type: 'image/png', imageData: image });
    store.setCropRegion(1, 0, 1, 2);
    store.targetWidth = 1;
    store.targetHeight = 2;
    store.mode = 'rgb888';
    store.process();

    expect(store.result.width).toBe(1);
    expect(store.result.height).toBe(2);
    expect(Array.from(store.result.bytes)).toEqual([0, 255, 0, 255, 255, 255]);
    expect(store.result.previewImageData.data).toEqual(new Uint8ClampedArray([
      0, 255, 0, 255, 255, 255, 255, 255
    ]));
  });

  it.each([
    ['c-array', '.h'],
    ['hex', '.hex.txt'],
    ['bin', '.bin']
  ] as const)('exports image output as %s', (format, extension) => {
    const store = useImageModuloStore();
    const image = new ImageData(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
    store.loadImageData({ fileName: 'sample.png', width: 1, height: 1, size: 4, type: 'image/png', imageData: image });
    store.mode = 'rgb565';
    store.exportFormat = format;
    store.process();
    expect(store.outputFileName.endsWith(extension)).toBe(true);
    expect(store.outputBlob().size).toBeGreaterThan(0);
  });
});
