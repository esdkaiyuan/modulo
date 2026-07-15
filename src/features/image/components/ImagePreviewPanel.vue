<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useImageModuloStore } from '../stores/imageModuloStore';
import ImagePixelSample from './ImagePixelSample.vue';
import CropOverlay from './CropOverlay.vue';

const store = useImageModuloStore();
const matrixCanvas = ref<HTMLCanvasElement | null>(null);
let rafPending = false;

function scheduleRender() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    renderMatrix();
  });
}

function renderMatrix() {
  const canvas = matrixCanvas.value;
  if (!canvas) return;

  const cw = store.cropW || store.sourceWidth;
  const ch = store.cropH || store.sourceHeight;
  if (cw <= 0 || ch <= 0) return;

  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  const context = canvas.getContext('2d');
  if (!context) return;

  if (!store.sourceImageData) return;

  const cropX = store.cropX;
  const cropY = store.cropY;
  const srcData = store.sourceImageData.data;
  const srcStride = store.sourceWidth;

  const image = context.createImageData(cw, ch);
  const data = image.data;

  if (store.colorMode === 'rgb565' && store.colorData.length > 0) {
    const rgb565Data = new Uint16Array(store.colorData.buffer);
    const colorStride = store.sourceWidth;
    for (let ty = 0; ty < ch; ty++) {
      for (let tx = 0; tx < cw; tx++) {
        const srcX = Math.round(store.cropX + (tx / cw) * (store.cropW || store.sourceWidth));
        const srcY = Math.round(store.cropY + (ty / ch) * (store.cropH || store.sourceHeight));
        const clampedX = Math.min(srcX, store.sourceWidth - 1);
        const clampedY = Math.min(srcY, store.sourceHeight - 1);
        const idx = clampedY * colorStride + clampedX;
        const rgb565 = rgb565Data[idx];
        const r = ((rgb565 >> 11) & 0x1F) << 3;
        const g = ((rgb565 >> 5) & 0x3F) << 2;
        const b = (rgb565 & 0x1F) << 3;
        const dstIdx = (ty * cw + tx) * 4;
        data[dstIdx] = r;
        data[dstIdx + 1] = g;
        data[dstIdx + 2] = b;
        data[dstIdx + 3] = 255;
      }
    }
  } else if (store.colorMode === 'palette16' && store.paletteIndex.length > 0) {
    const palette = [
      [0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 0],
      [0, 0, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255],
      [128, 0, 0], [0, 128, 0], [0, 0, 128], [128, 128, 0],
      [128, 0, 128], [0, 128, 128], [128, 128, 128], [64, 64, 64]
    ];
    const colorStride = store.sourceWidth;
    for (let ty = 0; ty < ch; ty++) {
      for (let tx = 0; tx < cw; tx++) {
        const srcX = Math.round(store.cropX + (tx / cw) * (store.cropW || store.sourceWidth));
        const srcY = Math.round(store.cropY + (ty / ch) * (store.cropH || store.sourceHeight));
        const clampedX = Math.min(srcX, store.sourceWidth - 1);
        const clampedY = Math.min(srcY, store.sourceHeight - 1);
        const idx = clampedY * colorStride + clampedX;
        const palIdx = store.paletteIndex[idx];
        const color = palette[palIdx] || [0, 0, 0];
        const dstIdx = (ty * cw + tx) * 4;
        data[dstIdx] = color[0];
        data[dstIdx + 1] = color[1];
        data[dstIdx + 2] = color[2];
        data[dstIdx + 3] = 255;
      }
    }
  } else {
    for (let ty = 0; ty < ch; ty++) {
      for (let tx = 0; tx < cw; tx++) {
        const srcX = Math.round(cropX + (tx / cw) * (store.cropW || store.sourceWidth));
        const srcY = Math.round(cropY + (ty / ch) * (store.cropH || store.sourceHeight));
        const clampedX = Math.min(srcX, store.sourceWidth - 1);
        const clampedY = Math.min(srcY, store.sourceHeight - 1);
        const srcIdx = (clampedY * srcStride + clampedX) * 4;
        const dstIdx = (ty * cw + tx) * 4;
        const gray = srcData[srcIdx] * 0.299 + srcData[srcIdx + 1] * 0.587 + srcData[srcIdx + 2] * 0.114;
        const val = gray >= store.threshold ? 0 : 255;
        data[dstIdx] = val;
        data[dstIdx + 1] = val;
        data[dstIdx + 2] = val;
        data[dstIdx + 3] = 255;
      }
    }
  }

  context.putImageData(image, 0, 0);
}

onMounted(() => {
  nextTick(scheduleRender);
});

watch(() => [store.cropX, store.cropY, store.cropW, store.cropH, store.threshold, store.colorMode], () => scheduleRender());

onUnmounted(() => {
  rafPending = false;
});
</script>

<template>
  <PanelSection class="image-preview" step="2" title="Original Image (with crop)">
    <template #actions><span>Sync Preview</span><span class="toggle-on"></span><strong>Preview (Dot Matrix)</strong></template>
    <div class="compare-grid">
      <CropOverlay>
        <div class="source-preview crop-box" :style="store.sourceWidth && store.sourceHeight ? { aspectRatio: `${store.sourceWidth} / ${store.sourceHeight}` } : {}">
          <img v-if="store.previewUrl" :src="store.previewUrl" alt="Source preview" />
          <div v-else class="empty-preview image-sample-empty"><ImagePixelSample variant="source" /><span>Upload an image to preview</span></div>
          <footer class="source-status">
            <span>Source: {{ store.sourceWidth || '-' }} × {{ store.sourceHeight || '-' }} px</span>
            <span>Crop: {{ store.cropW || store.sourceWidth || '-' }} × {{ store.cropH || store.sourceHeight || '-' }} px</span>
            <span>Offset: {{ store.cropX }}, {{ store.cropY }}</span>
          </footer>
        </div>
      </CropOverlay>
      <div class="dot-preview matrix-canvas-wrap" :class="{ 'sample-preview': !store.bitmap.length }" :style="{ aspectRatio: store.cropW && store.cropH ? `${store.cropW} / ${store.cropH}` : `${store.targetWidth} / ${store.targetHeight}` }">
        <canvas v-if="store.bitmap.length" ref="matrixCanvas"></canvas>
        <ImagePixelSample v-else variant="matrix" />
        <footer class="matrix-status">
          <span><b class="legend on"></b>1 (On)</span>
          <span><b class="legend off"></b>0 (Off)</span>
          <span>{{ store.targetWidth }} × {{ store.targetHeight }} px → {{ store.totalBits }} bits ({{ store.bytes.length || Math.ceil(store.totalBits / 8) }} bytes)</span>
        </footer>
      </div>
    </div>
  </PanelSection>
</template>
