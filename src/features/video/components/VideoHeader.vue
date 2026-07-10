<script setup lang="ts">
import { useVideoModuloStore } from '../stores/videoModuloStore';
import { extractVideoFrames } from '../utils/videoFrameExtractor';

const store = useVideoModuloStore();

async function handleVideo(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const result = await extractVideoFrames({
    file,
    startTime: store.startTime,
    endTime: store.endTime,
    sampleFps: store.sampleFps,
    everyNFrames: store.sampleEveryNFrames
  });
  store.loadExtractedFrames(result);
}
</script>

<template>
  <header class="dm-header">
    <div class="dm-brand">
      <span class="brand-mark video-mark">▦</span>
      <div>
        <h1>Video to Dot Matrix Extractor <span>v1.3.0</span></h1>
        <p>Extract frames from video and convert to dot matrix data for embedded displays</p>
      </div>
    </div>
    <div class="header-actions video-file-bar">
      <label class="ghost-btn batch-upload">▣ Open Video<input type="file" accept="video/*" @change="handleVideo" /></label>
      <strong>{{ store.fileName || 'sample_video_1080p.mp4' }} <span>●</span></strong>
      <span>{{ store.sourceWidth || 1920 }}×{{ store.sourceHeight || 1080 }} · {{ store.sampleFps.toFixed(2) }} FPS · {{ store.duration ? store.duration.toFixed(2) : '00:45:22' }}</span>
      <button>⋮</button>
    </div>
  </header>
</template>
