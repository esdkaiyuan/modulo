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
    <div class="header-actions">
      <label class="ghost-btn batch-upload">▣ Open Video<input type="file" accept="video/*" @change="handleVideo" /></label>
      <strong>{{ store.fileName || 'No video loaded' }} <span v-if="store.fileName">●</span></strong>
      <span>{{ store.sourceWidth }}×{{ store.sourceHeight }} · {{ store.sampleFps }} FPS · {{ store.duration.toFixed(2) }}s</span>
      <button>⋮</button>
    </div>
  </header>
</template>
