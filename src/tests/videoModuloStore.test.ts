import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useVideoModuloStore } from '../features/video/stores/videoModuloStore';

function frame(whiteFirst: boolean) {
  return new ImageData(
    new Uint8ClampedArray(whiteFirst
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

describe('videoModuloStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('processes extracted video frames into encoded animation output', () => {
    const store = useVideoModuloStore();

    store.loadExtractedFrames({
      fileName: 'sample.mp4',
      width: 2,
      height: 2,
      duration: 10,
      frames: [
        { imageData: frame(true), time: 1 },
        { imageData: frame(false), time: 2 }
      ]
    });
    store.targetWidth = 2;
    store.targetHeight = 2;
    store.threshold = 128;
    store.dithering = 'none';
    store.outputFps = 10;

    store.processFrames();

    expect(store.processedFrames).toHaveLength(2);
    expect(Array.from(store.processedFrames[0].bytes)).toEqual([0x90]);
    expect(store.bytesPerFrame).toBe(1);
    expect(store.estimatedBytes).toBe(2);
    expect(store.selectedFrame?.time).toBe(1);
    expect(store.generatedSource).toContain('const uint8_t sample_video_frames[2][1] PROGMEM');
    expect(store.generatedSource).toContain('const uint16_t sample_video_frame_count = 2;');
  });

  it('uses one Palette16 palette for all video frames and retains FPS', () => {
    const store = useVideoModuloStore();
    store.mode = 'palette16';
    store.outputFps = 12;
    store.targetWidth = 2;
    store.targetHeight = 2;
    store.loadExtractedFrames({
      fileName: 'color.mp4', width: 2, height: 2, duration: 1,
      frames: [{ imageData: frame(true), time: 0 }, { imageData: frame(false), time: 0.5 }]
    });
    expect(store.processedFrames[0].result.paletteBytes).toEqual(store.processedFrames[1].result.paletteBytes);
    expect(store.generatedSource).toContain('fps = 12');
    store.exportFormat = 'bin';
    expect(store.outputFileName).toBe('color_video.bin');
  });
});
