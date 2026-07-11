import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAnimationModuloStore } from '../features/animation/stores/animationModuloStore';

function frame(blackFirst: boolean) {
  return new ImageData(
    new Uint8ClampedArray(blackFirst
      ? [
          0, 0, 0, 255,
          255, 255, 255, 255,
          255, 255, 255, 255,
          0, 0, 0, 255
        ]
      : [
          255, 255, 255, 255,
          0, 0, 0, 255,
          0, 0, 0, 255,
          255, 255, 255, 255
        ]),
    2,
    2
  );
}

describe('animationModuloStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('processes decoded frames with range and sampling into frame arrays', () => {
    const store = useAnimationModuloStore();

    store.loadDecodedFrames({
      fileName: 'walk.gif',
      width: 2,
      height: 2,
      frames: [
        { imageData: frame(true), delay: 100 },
        { imageData: frame(false), delay: 200 },
        { imageData: frame(true), delay: 300 }
      ]
    });
    store.targetWidth = 2;
    store.targetHeight = 2;
    store.threshold = 128;
    store.dithering = 'none';
    store.startFrame = 1;
    store.endFrame = 3;
    store.sampleStep = 2;

    store.processFrames();

    expect(store.processedFrames).toHaveLength(2);
    expect(Array.from(store.processedFrames[0].bytes)).toEqual([0x60]);
    expect(store.delayTable).toEqual([100, 300]);
    expect(store.generatedSource).toContain('const uint8_t walk_frames[2][1] PROGMEM');
    expect(store.generatedSource).toContain('const uint16_t walk_delays[2] PROGMEM');
    expect(store.selectedFrame?.sourceIndex).toBe(1);
  });

  it('uses one Palette16 palette for all selected frames and exports binary', () => {
    const store = useAnimationModuloStore();
    store.mode = 'palette16';
    store.targetWidth = 2;
    store.targetHeight = 2;
    store.loadDecodedFrames({
      fileName: 'color.gif', width: 2, height: 2,
      frames: [{ imageData: frame(true), delay: 80 }, { imageData: frame(false), delay: 120 }]
    });
    expect(store.processedFrames[0].result.paletteBytes).toEqual(store.processedFrames[1].result.paletteBytes);
    expect(store.delayTable).toEqual([80, 120]);
    store.exportFormat = 'bin';
    expect(store.outputFileName).toBe('color_animation.bin');
    expect(store.outputBlob().size).toBe(32 + store.processedFrames.reduce((sum, item) => sum + item.result.bytes.length, 0));
    store.exportFormat = 'hex';
    expect(store.generatedSource).not.toContain('const uint8_t');
    expect(store.generatedSource).toMatch(/[0-9A-F]{2}/);
  });
});
