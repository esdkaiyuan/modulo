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

  context.putImageData(store.result.previewImageData, 0, 0);
}

onMounted(renderOutputPreview);
watch(() => [store.result, store.targetWidth, store.targetHeight], () => nextTick(renderOutputPreview), { deep: true });
</script>

<template>
  <section class="image-output-row">
    <PanelSection class="image-output image-code-panel" step="4" :title="store.exportFormat === 'c-array' ? 'Generated C Array' : store.exportFormat === 'hex' ? 'Generated HEX' : 'Binary Output'">
      <template #actions><button class="ghost-btn" @click="copyOutput">⧉ Copy</button><button class="ghost-btn" @click="downloadOutput">⇩ Download</button></template>
      <pre class="code-block image-adaptive-window">{{ store.generatedSource }}</pre>
      <footer class="image-output-stats">
        <span>Total Bytes: {{ store.result.bytes.length + store.result.paletteBytes.length }}</span>
        <span>Total Bits: {{ store.totalBits }}</span>
        <span>Width: {{ store.targetWidth }} px</span>
        <span>Height: {{ store.targetHeight }} px</span>
        <span>Memory: {{ store.bytes.length || Math.ceil(store.totalBits / 8) }} B</span>
      </footer>
    </PanelSection>

    <PanelSection class="output-preview image-output-preview-panel" step="5" title="Output Preview">
      <div class="dot-preview matrix-canvas-wrap image-adaptive-window adaptive-material-window" :class="{ 'sample-preview': !store.result.bytes.length }">
        <canvas v-if="store.result.bytes.length" ref="outputCanvas"></canvas>
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
