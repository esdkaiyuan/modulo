<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useBatchModuloStore } from '../stores/batchModuloStore';

const store = useBatchModuloStore();
const previewCanvas = ref<HTMLCanvasElement | null>(null);

function renderPreview() {
  const item = store.selectedItem;
  const canvas = previewCanvas.value;
  if (!item || !canvas) return;
  canvas.width = store.targetWidth;
  canvas.height = store.targetHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  const image = context.createImageData(store.targetWidth, store.targetHeight);
  for (let index = 0; index < item.bitmap.length; index += 1) {
    const offset = index * 4;
    const value = item.bitmap[index] ? 0 : 255;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function downloadMerged() {
  const url = URL.createObjectURL(store.mergedBlob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'batch_modulo_results.h';
  anchor.click();
  URL.revokeObjectURL(url);
}

async function copyMerged() {
  await navigator.clipboard?.writeText(store.mergedSource);
}

onMounted(renderPreview);
watch(() => [store.selectedId, store.selectedItem?.bitmap, store.targetWidth, store.targetHeight], () => nextTick(renderPreview), { deep: true });
</script>

<template>
  <PanelSection class="batch-results" step="4" title="Output & Results">
    <template #actions>
      <select v-model="store.selectedId"><option v-for="item in store.items" :key="item.id" :value="item.id">{{ item.fileName }} ({{ item.status }})</option></select>
      <button class="ghost-btn" @click="copyMerged">⧉ Copy Merged</button>
    </template>
    <div class="result-layout">
      <div class="batch-preview landscape">
        <canvas v-if="store.selectedItem?.bitmap.length" ref="previewCanvas"></canvas>
        <span v-else>Select a processed image</span>
      </div>
      <pre class="code-block">{{ store.selectedItem?.source || 'Process images to generate output.' }}</pre>
      <div class="export-stack">
        <h3>Export All Results</h3>
        <button @click="downloadMerged">▧ Merge into One File</button>
        <button>□ Separate Files per Input</button>
        <button>▤ Generate Report (CSV)</button>
      </div>
    </div>
  </PanelSection>
</template>
