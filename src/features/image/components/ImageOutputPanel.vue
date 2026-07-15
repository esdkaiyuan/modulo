<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useImageModuloStore } from '../stores/imageModuloStore';
import ImagePixelSample from './ImagePixelSample.vue';

const store = useImageModuloStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
const isFullscreen = ref(false);

const gridStyle = computed(() => {
  const scale = store.previewScale || 1;
  const w = store.targetWidth * scale;
  const h = store.targetHeight * scale;
  return {
    width: w + 'px',
    height: h + 'px',
    backgroundSize: scale + 'px ' + scale + 'px'
  };
});

let rafScheduled = false;

function scheduleRender() {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    rafScheduled = false;
    renderBitmap();
    applyLayout();
  });
}

function applyLayout() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const scale = store.previewScale || 1;
  canvas.style.width = (store.targetWidth * scale) + 'px';
  canvas.style.height = (store.targetHeight * scale) + 'px';
}

function renderBitmap() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const cw = store.targetWidth;
  const ch = store.targetHeight;
  if (cw <= 0 || ch <= 0) return;

  // In color mode, render from color data even without mono bitmap
  const hasColorData = store.colorMode !== 'mono' && store.sourceImageData && store.cropW > 0 && store.cropH > 0;
  if (!hasColorData && !store.bitmap.length) return;

  canvas.width = cw;
  canvas.height = ch;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const image = ctx.createImageData(cw, ch);
  const data = image.data;

  if (hasColorData) {
    renderColorImage(data, cw, ch);
  } else {
    for (let i = 0; i < store.bitmap.length; i++) {
      const off = i * 4;
      const v = store.bitmap[i] ? 0 : 255;
      data[off] = v;
      data[off + 1] = v;
      data[off + 2] = v;
      data[off + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
}

function renderColorImage(data: Uint8ClampedArray, cw: number, ch: number) {
  const cropX = store.cropX;
  const cropY = store.cropY;
  const cropW = store.cropW;
  const cropH = store.cropH;
  const srcData = store.sourceImageData!.data;
  const srcStride = store.sourceWidth;

  if (store.colorMode === 'rgb565' && store.colorData.length > 0) {
    const rgb565Data = new Uint16Array(store.colorData.buffer);
    const colorStride = store.sourceWidth;
    for (let ty = 0; ty < ch; ty++) {
      for (let tx = 0; tx < cw; tx++) {
        const srcX = Math.min(Math.round(cropX + (tx / cw) * cropW), store.sourceWidth - 1);
        const srcY = Math.min(Math.round(cropY + (ty / ch) * cropH), store.sourceHeight - 1);
        const idx = srcY * colorStride + srcX;
        const c16 = rgb565Data[idx];
        const di = (ty * cw + tx) * 4;
        data[di]     = ((c16 >> 11) & 0x1F) << 3;
        data[di + 1] = ((c16 >> 5)  & 0x3F) << 2;
        data[di + 2] = (c16 & 0x1F) << 3;
        data[di + 3] = 255;
      }
    }
  } else if (store.colorMode === 'palette16' && store.paletteIndex.length > 0) {
    const palette: [number, number, number][] = [
      [0,0,0],[255,255,255],[255,0,0],[0,255,0],
      [0,0,255],[255,255,0],[255,0,255],[0,255,255],
      [128,0,0],[0,128,0],[0,0,128],[128,128,0],
      [128,0,128],[0,128,128],[128,128,128],[64,64,64]
    ];
    const colorStride = store.sourceWidth;
    for (let ty = 0; ty < ch; ty++) {
      for (let tx = 0; tx < cw; tx++) {
        const srcX = Math.min(Math.round(cropX + (tx / cw) * cropW), store.sourceWidth - 1);
        const srcY = Math.min(Math.round(cropY + (ty / ch) * cropH), store.sourceHeight - 1);
        const idx = srcY * colorStride + srcX;
        const pIdx = store.paletteIndex[idx];
        const color = palette[pIdx] || [0, 0, 0];
        const di = (ty * cw + tx) * 4;
        data[di]     = color[0];
        data[di + 1] = color[1];
        data[di + 2] = color[2];
        data[di + 3] = 255;
      }
    }
  } else {
    for (let ty = 0; ty < ch; ty++) {
      for (let tx = 0; tx < cw; tx++) {
        const srcX = Math.min(Math.round(cropX + (tx / cw) * cropW), store.sourceWidth - 1);
        const srcY = Math.min(Math.round(cropY + (ty / ch) * cropH), store.sourceHeight - 1);
        const si = (srcY * srcStride + srcX) * 4;
        const di = (ty * cw + tx) * 4;
        const gray = srcData[si] * 0.299 + srcData[si + 1] * 0.587 + srcData[si + 2] * 0.114;
        const v = gray >= store.threshold ? 0 : 255;
        data[di]     = v;
        data[di + 1] = v;
        data[di + 2] = v;
        data[di + 3] = 255;
      }
    }
  }
}

onMounted(() => {
  renderBitmap();
  nextTick(() => {
    const container = containerRef.value;
    if (container) {
      resizeObserver = new ResizeObserver(() => applyLayout());
      resizeObserver.observe(container);
    }
  });
});

watch(
  () => [store.targetWidth, store.targetHeight, store.colorMode, store.cropX, store.cropY, store.cropW, store.cropH, store.bitmap.length, store.polarity],
  () => scheduleRender()
);

watch(() => store.bitmap, () => scheduleRender(), { deep: true });

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
  rafScheduled = false;
});

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  nextTick(() => applyLayout());
}

function toggleInvert() {
  store.polarity = store.polarity === 'positive' ? 'negative' : 'positive';
  store.process();
}

async function copyOutput() {
  if (!store.generatedSource) return;
  try {
    await navigator.clipboard.writeText(store.generatedSource);
  } catch { /* ignore */ }
}

function downloadOutput() {
  const blob = store.outputBlob();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = store.outputFileName;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="image-output-row">
    <PanelSection class="output-preview image-output-preview-panel" step="4" title="Output Preview">
      <div
        ref="containerRef"
        class="dot-preview output-preview-area"
        :class="{
          'preview-fullscreen': isFullscreen,
          'grid-on': store.showGrid && store.bitmap.length,
          'has-content': store.bitmap.length || store.colorMode !== 'mono'
        }"
      >
        <canvas
          ref="canvasRef"
          class="output-canvas"
          :class="{ 'inverted': store.polarity === 'negative' }"
        ></canvas>
        <ImagePixelSample v-if="!store.bitmap.length && store.colorMode === 'mono'" variant="output" />
        <div
          v-show="store.showGrid && store.bitmap.length"
          class="grid-overlay"
          :style="gridStyle"
        ></div>
      </div>
      <footer class="preview-controls">
        <label class="ctrl-label">
          Scale
          <select :value="store.previewScale" @change="store.previewScale = Number(($event.target as HTMLSelectElement).value)">
            <option v-for="s in [1, 2, 4, 6, 8]" :key="s" :value="s">{{ s }}x</option>
          </select>
        </label>
        <label class="ctrl-label">
          Grid
          <select :value="store.showGrid ? 'on' : 'off'" @change="store.showGrid = ($event.target as HTMLSelectElement).value === 'on'">
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </label>
        <button
          class="ghost-btn icon-btn"
          :class="{ active: isFullscreen }"
          @click="toggleFullscreen"
          :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
        >&#x29F8;</button>
        <button
          class="ghost-btn icon-btn"
          :class="{ active: store.polarity === 'negative' }"
          @click="toggleInvert"
          title="Invert polarity"
        >&#x29D7;</button>
      </footer>
    </PanelSection>
  </section>
</template>

<style scoped>
.image-output-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.image-output-row :deep(.dm-card) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.image-output-row :deep(.dm-card) :deep(.dm-card-title) {
  flex-shrink: 0;
}

.image-output-row :deep(.dm-card) :deep(.dm-card-title) + * {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid #e8ecf1;
  background: #fafbfc;
  flex-shrink: 0;
}

.ctrl-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5d6b82;
  white-space: nowrap;
}

.ctrl-label select {
  min-height: 28px;
  padding: 2px 6px;
  border: 1px solid #d4dce6;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #d4dce6;
  border-radius: 4px;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.icon-btn:hover {
  background: #eef2f8;
  border-color: #b0bdd0;
}

.icon-btn.active {
  background: #2167e8;
  border-color: #2167e8;
  color: #fff;
}

.output-preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 200px;
}

.output-canvas {
  image-rendering: pixelated;
  flex-shrink: 0;
  max-width: 100%;
  max-height: 100%;
}

/* Instant invert feedback via CSS */
.output-canvas.inverted {
  filter: invert(1);
}

/* Grid overlay: positioned to exactly match the scaled canvas */
.grid-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
}

/* Fullscreen: expand the preview area */
.preview-fullscreen {
  max-height: none !important;
  min-height: 300px;
  flex: 1;
}
</style>
