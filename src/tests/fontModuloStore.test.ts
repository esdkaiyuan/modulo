import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useFontModuloStore } from '../features/font/stores/fontModuloStore';

describe('fontModuloStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('generates bitmap bytes and C source from injected image data', () => {
    const store = useFontModuloStore();
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

    store.text = '汉';
    store.targetWidth = 2;
    store.targetHeight = 2;
    store.generateFromImageData(image);

    expect(Array.from(store.bitmap)).toEqual([1, 0, 0, 1]);
    expect(Array.from(store.bytes)).toEqual([0x90]);
    expect(store.generatedSource).toContain('const uint8_t font_u6c49_2x2[] PROGMEM');
  });
});
