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

  it.each(['rgb565', 'rgb888', 'palette16'] as const)('generates %s font output', (mode) => {
    const store = useFontModuloStore();
    store.targetWidth = 1;
    store.targetHeight = 1;
    store.mode = mode;
    store.foregroundColor = '#FF0000';
    store.backgroundColor = '#0000FF';
    store.generateFromImageData(new ImageData(new Uint8ClampedArray([0, 0, 0, 255]), 1, 1));
    expect(store.result.mode).toBe(mode);
    expect(store.result.bytes.length).toBeGreaterThan(0);
  });
});
