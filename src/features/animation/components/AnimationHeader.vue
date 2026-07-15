<script setup lang="ts">
import { decodeGif } from '../utils/gifDecoder';
import { useAnimationModuloStore } from '../stores/animationModuloStore';

const store = useAnimationModuloStore();

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const decoded = decodeGif(await file.arrayBuffer());
  store.loadDecodedFrames({
    fileName: file.name,
    width: decoded.width,
    height: decoded.height,
    frames: decoded.frames
  });
}
</script>

<template>
  <header class="dm-header">
    <div class="dm-brand">
      <span class="brand-mark matrix-mark">▦</span>
      <div>
        <h1>DotMatrix Frame Extractor</h1>
        <p>Extract frames from animations and generate embedded-ready data</p>
      </div>
    </div>
    <div class="header-actions">
      <label class="ghost-btn batch-upload">▣ Open<input type="file" accept="image/gif" @change="handleFile" /></label>
      <button @click="store.processFrames">↥ Re-process</button>
      <button @click="store.loadDecodedFrames({ fileName: '', width: 0, height: 0, frames: [] })">▥ Clear All</button>
      <button>? Help</button>
    </div>
  </header>
</template>
