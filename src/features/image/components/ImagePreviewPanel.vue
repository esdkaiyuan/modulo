<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useImageModuloStore } from '../stores/imageModuloStore';

const store = useImageModuloStore();
const matrixCanvas = ref<HTMLCanvasElement | null>(null);

function renderMatrix() {
  const canvas = matrixCanvas.value;
  if (!canvas) return;
  canvas.width = store.targetWidth;
  canvas.height = store.targetHeight;
  const context = canvas.getContext('2d');
  if (!context) return;

  const image = context.createImageData(store.targetWidth, store.targetHeight);
  for (let index = 0; index < store.bitmap.length; index += 1) {
    const offset = index * 4;
    const value = store.bitmap[index] ? 0 : 255;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

onMounted(renderMatrix);
watch(() => [store.bitmap, store.targetWidth, store.targetHeight], () => nextTick(renderMatrix), { deep: true });
</script>

<template>
  <PanelSection class="image-preview" step="2" title="Original Image (with crop)">
    <template #actions><span>Sync Preview</span><span class="toggle-on"></span><strong>Preview (Dot Matrix)</strong></template>
    <div class="compare-grid">
      <div class="source-preview crop-box">
        <img v-if="store.previewUrl" :src="store.previewUrl" alt="Source preview" />
        <div v-else class="empty-preview">Upload an image to preview</div>
      </div>
      <div class="dot-preview matrix-canvas-wrap">
        <canvas ref="matrixCanvas"></canvas>
      </div>
    </div>
  </PanelSection>
</template>
