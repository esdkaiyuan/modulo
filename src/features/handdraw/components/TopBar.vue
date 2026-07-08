<script setup lang="ts">
import { usePixelStore } from '../../../stores/pixelStore';

const store = usePixelStore();

function downloadOutput() {
  const url = URL.createObjectURL(store.outputBlob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = store.outputFileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <div class="cat-logo">⌁</div>
      <strong>PixelCraft Web</strong>
      <span class="version">v1.4.2</span>
    </div>

    <div class="top-controls">
      <label class="select-wrap">
        Canvas:
        <select :value="store.width" @change="store.setCanvasSize(Number(($event.target as HTMLSelectElement).value))">
          <option :value="16">16x16</option>
          <option :value="32">32x32</option>
          <option :value="64">64x64</option>
        </select>
      </label>

      <label class="zoom-control" title="Zoom">
        <span>⌕</span>
        <input v-model.number="store.zoom" type="range" min="200" max="1200" step="50" />
        <strong>{{ store.zoom }}%</strong>
      </label>
    </div>

    <div class="top-actions">
      <span class="saved">☁ Saved just now</span>
      <button class="icon-button" title="Theme">☼</button>
      <button class="export-button" @click="downloadOutput">Export <span>⌄</span></button>
    </div>
  </header>
</template>
