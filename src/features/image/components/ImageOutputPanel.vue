<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useImageModuloStore } from '../stores/imageModuloStore';
import ImagePixelSample from './ImagePixelSample.vue';

const store = useImageModuloStore();
const outputCanvas = ref<HTMLCanvasElement | null>(null);

async function copyOutput() {
  await navigator.clipboard?.writeText(store.generatedSource);
}

function downloadOutput() {
  const url = URL.createObjectURL(store.outputBlob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = store.outputFileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderOutputPreview() {
  const canvas = outputCanvas.value;
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

onMounted(renderOutputPreview);
watch(() => [store.bitmap, store.targetWidth, store.targetHeight], () => nextTick(renderOutputPreview), { deep: true });
</script>

<template>
  <section class="image-output-row">
    <PanelSection class="image-output image-code-panel" step="4" title="Generated C Array">
      <template #actions><button class="ghost-btn" @click="copyOutput">⧉ Copy</button><button class="ghost-btn" @click="downloadOutput">⇩ Download</button></template>
      <pre class="code-block image-adaptive-window">{{ store.generatedSource }}</pre>
      <footer class="image-output-stats">
        <span>Total Bytes: {{ store.bytes.length || Math.ceil(store.totalBits / 8) }}</span>
        <span>Total Bits: {{ store.totalBits }}</span>
        <span>Width: {{ store.targetWidth }} px</span>
        <span>Height: {{ store.targetHeight }} px</span>
        <span>Memory: {{ store.bytes.length || Math.ceil(store.totalBits / 8) }} B</span>
      </footer>
    </PanelSection>

    <PanelSection class="output-preview image-output-preview-panel" step="5" title="Output Preview">
      <div class="dot-preview matrix-canvas-wrap image-adaptive-window adaptive-material-window" :class="{ 'sample-preview': !store.bitmap.length }">
        <canvas v-if="store.bitmap.length" ref="outputCanvas"></canvas>
        <ImagePixelSample v-else variant="output" />
      </div>
      <footer class="preview-controls">
        <label>Scale:<select><option>4x</option><option>2x</option><option>1x</option></select></label>
        <label>Grid:<select><option>On</option><option>Off</option></select></label>
        <button>⛶</button>
      </footer>
    </PanelSection>
  </section>
</template>
