<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useBatchModuloStore } from '../stores/batchModuloStore';
import BatchPixelSample from './BatchPixelSample.vue';

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
  context.putImageData(item.result.previewImageData, 0, 0);
}

function downloadMerged() {
  const blob = store.exportFormat === 'bin' && store.selectedItem ? store.itemBlob(store.selectedItem.id) : store.mergedBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = store.exportFormat === 'bin' ? `${store.selectedItem?.fileName || 'batch'}.bin` : store.exportFormat === 'hex' ? 'batch_modulo_results.hex.txt' : 'batch_modulo_results.h';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function copyMerged() {
  await navigator.clipboard?.writeText(store.mergedSource);
}

onMounted(renderPreview);
watch(() => [store.selectedId, store.selectedItem?.result, store.targetWidth, store.targetHeight], () => nextTick(renderPreview), { deep: true });
</script>

<template>
  <PanelSection class="batch-results" step="4" title="Output & Results">
    <template #actions>
      <select v-model="store.selectedId"><option v-for="item in store.items" :key="item.id" :value="item.id">{{ item.fileName }} ({{ item.status }})</option></select>
      <button class="ghost-btn" @click="copyMerged">⧉ Copy Merged</button>
    </template>
    <div class="result-layout">
      <div class="batch-preview landscape adaptive-material-window batch-adaptive-window" :class="{ 'sample-preview': !store.selectedItem?.result.bytes.length }">
        <canvas v-if="store.selectedItem?.result.bytes.length" ref="previewCanvas"></canvas>
        <BatchPixelSample v-else variant="matrix" :frame="1" />
      </div>
      <pre class="code-block">{{ store.selectedItem?.source || 'Process images to generate output.' }}</pre>
      <div class="export-stack batch-export-panel">
        <h3>Export All Results</h3>
        <BatchPixelSample variant="export" :frame="2" compact />
        <button @click="downloadMerged">▧ {{ store.exportFormat === 'bin' ? 'Download Selected Binary' : 'Merge into One File' }}</button>
        <button>□ Separate Files per Input</button>
        <button>▤ Generate Report (CSV)</button>
      </div>
    </div>
  </PanelSection>
</template>
