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

  it('resamples evenly to the requested output frame count', () => {
    const store = useAnimationModuloStore();

    store.loadDecodedFrames({
      fileName: 'walk.gif',
      width: 2,
      height: 2,
      frames: Array.from({ length: 10 }, (_, i) => ({ imageData: frame(i % 2 === 0), delay: 100 + i }))
    });
    store.targetWidth = 2;
    store.targetHeight = 2;

    // Loading defaults the target count to every decoded frame
    expect(store.targetFrameCount).toBe(10);
    expect(store.processedFrames).toHaveLength(10);

    store.samplingMode = 'count';
    store.targetFrameCount = 4;
    store.processFrames();
    expect(store.processedFrames.map((f) => f.sourceIndex)).toEqual([1, 4, 7, 10]);

    store.targetFrameCount = 1;
    store.processFrames();
    expect(store.processedFrames.map((f) => f.sourceIndex)).toEqual([1]);

    // Requesting more frames than the range holds clamps to the range
    store.targetFrameCount = 99;
    store.processFrames();
    expect(store.processedFrames).toHaveLength(10);

    // Count mode respects the selected frame range
    store.startFrame = 3;
    store.endFrame = 8;
    store.targetFrameCount = 3;
    store.processFrames();
    expect(store.processedFrames.map((f) => f.sourceIndex)).toEqual([3, 6, 8]);
  });
});
