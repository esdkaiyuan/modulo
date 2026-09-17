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

async function waitUntilIdle(store: ReturnType<typeof useVideoModuloStore>) {
  for (let i = 0; i < 40; i += 1) {
    if (!store.isProcessing) return;
    await new Promise((r) => setTimeout(r, 25));
  }
}

describe('videoModuloStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('processes extracted video frames into encoded animation output', async () => {
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
    await waitUntilIdle(store);

    store.targetWidth = 2;
    store.targetHeight = 2;
    store.threshold = 128;
    store.dithering = 'none';
    store.outputFps = 10;

    await store.processFrames();
    await waitUntilIdle(store);
    // Debounced watcher may have queued another pass after size change.
    await store.processFrames();
    await waitUntilIdle(store);

    expect(store.processedFrames).toHaveLength(2);
    expect(Array.from(store.processedFrames[0].bytes)).toEqual([0x90]);
    expect(store.bytesPerFrame).toBe(1);
    expect(store.estimatedBytes).toBe(2);
    expect(store.selectedFrame?.time).toBe(1);
    expect(store.generatedSource).toContain('const uint8_t sample_video_frames[2][1] PROGMEM');
    expect(store.generatedSource).toContain('const uint16_t sample_video_frame_count = 2;');
  });

  it('appends audio PCM arrays to generated source when audio modulo is enabled', async () => {
    const store = useVideoModuloStore();

    store.loadExtractedFrames({
      fileName: 'clip.mp4',
      width: 2,
      height: 2,
      duration: 1,
      frames: [{ imageData: frame(true), time: 0 }]
    });
    await waitUntilIdle(store);
    store.targetWidth = 2;
    store.targetHeight = 2;
    await store.processFrames();
    await waitUntilIdle(store);

    // Inject quantized audio results directly (jsdom has no OfflineAudioContext).
    store.audioModEnabled = true;
    store.audioPcmInOutput = true;
    store.audioVisualMode = 'waveform';
    store.audioSampleRate = 8000;
    store.audioBitDepth = 8;
    store.audioSamples = new Float32Array(16).fill(0.25);
    store.audioBytes = new Uint8Array([0x90, 0xA0, 0xB0, 0xC0, 0xD0, 0xE0, 0xF0, 0x80, 0x70, 0x60, 0x50, 0x40, 0x30, 0x20, 0x10, 0x00]);
    store.audioWaveformWidth = 8;
    store.audioWaveformHeight = 4;
    store.audioWaveformBitmap = new Uint8Array(32).fill(1);

    expect(store.generatedSource).toContain('const uint8_t clip_video_audio[] PROGMEM');
    expect(store.generatedSource).toContain('0x90, 0xA0, 0xB0, 0xC0');
    expect(store.generatedSource).toContain('const uint32_t clip_video_audio_len = 16');
    expect(store.generatedSource).toContain('const uint32_t clip_video_audio_rate = 8000');
    expect(store.generatedSource).toContain('clip_video_audio_waveform');
    expect(store.estimatedBytes).toBeGreaterThan(2);
  });
});
