<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useImageModuloStore } from '../stores/imageModuloStore';
import ImagePixelSample from './ImagePixelSample.vue';

const store = useImageModuloStore();
const matrixCanvas = ref<HTMLCanvasElement | null>(null);

function renderMatrix() {
  const canvas = matrixCanvas.value;
  if (!canvas) return;
  canvas.width = store.targetWidth;
  canvas.height = store.targetHeight;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.putImageData(store.result.previewImageData, 0, 0);
}

onMounted(renderMatrix);
watch(() => [store.result, store.targetWidth, store.targetHeight], () => nextTick(renderMatrix), { deep: true });
</script>

<template>
  <PanelSection class="image-preview" step="2" title="Original Image (with crop)">
    <template #actions><span>Sync Preview</span><span class="toggle-on"></span><strong>Preview (Dot Matrix)</strong></template>
    <div class="compare-grid">
      <div class="source-preview crop-box image-adaptive-window adaptive-material-window">
        <img v-if="store.previewUrl" :src="store.previewUrl" alt="Source preview" />
        <div v-else class="empty-preview image-sample-empty"><ImagePixelSample variant="source" /><span>Upload an image to preview</span></div>
        <div class="crop-frame" aria-hidden="true"><i></i><i></i><i></i><i></i><b>{{ store.targetWidth }} × {{ store.targetHeight }}</b></div>
        <footer class="source-status">
          <span>Source: {{ store.sourceWidth || 1280 }} × {{ store.sourceHeight || 720 }} px</span>
          <span>Cropped: {{ store.targetWidth }} × {{ store.targetHeight }} px</span>
          <span>Zoom: 100%</span>
        </footer>
      </div>
      <div class="dot-preview matrix-canvas-wrap image-adaptive-window adaptive-material-window" :class="{ 'sample-preview': !store.result.bytes.length }">
        <canvas v-if="store.result.bytes.length" ref="matrixCanvas"></canvas>
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
