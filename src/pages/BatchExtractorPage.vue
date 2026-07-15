<script setup lang="ts">
import { ref } from 'vue';
import ToolLayout from '../components/common/ToolLayout.vue';
import BatchFilesTable from '../features/batch/components/BatchFilesTable.vue';
import BatchConfigPanel from '../features/batch/components/BatchConfigPanel.vue';
import BatchResultsPanel from '../features/batch/components/BatchResultsPanel.vue';
import BatchLogPanel from '../features/batch/components/BatchLogPanel.vue';
import { useBatchModuloStore } from '../features/batch/stores/batchModuloStore';
import { buildExport, downloadExport } from '../features/shared/exportVariants';

const store = useBatchModuloStore();
const activeMode = ref('queue');

const modes = [
  { key: 'queue', label: 'Queue', icon: '◐' },
  { key: 'log', label: 'Log', icon: '≡' },
  { key: 'results', label: 'Results', icon: '▥' },
];

function onImport() {
  document.querySelector<HTMLInputElement>('.batch-file-input')?.click();
}

async function loadBatchFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = ''; // allow re-selecting the same files
  for (const file of files) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Cannot decode ${file.name}`));
      });
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.canvas.width = img.naturalWidth;
      ctx.canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      store.addImageData({
        fileName: file.name, size: file.size, type: file.type,
        imageData: ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight), dataUrl: url
      });
    } catch {
      // Skip unreadable files instead of aborting the whole batch.
      URL.revokeObjectURL(url);
    }
  }
}

function onExport(format: string) {
  if (format === 'clipboard') {
    navigator.clipboard?.writeText(store.mergedSource);
    return;
  }
  const doneItems = store.items.filter((item) => item.status === 'done');
  const result = buildExport(format, {
    name: 'batch_results',
    source: store.mergedSource,
    frames: doneItems.map((item) => Array.from(item.bytes)),
    width: store.targetWidth,
    height: store.targetHeight,
    extra: { files: doneItems.length }
  });
  downloadExport('batch_results', result);
}

function onSettingChange(key: string, value: unknown) {
  if (key === 'width') store.targetWidth = value as number;
  if (key === 'height') store.targetHeight = value as number;
}
</script>

<template>
  <ToolLayout
    tool="batch"
    title="Batch Processor"
    subtitle="Process multiple files with batch operations"
    :width="store.targetWidth"
    :height="store.targetHeight"
    :code-panel-source="store.mergedSource"
    @import="onImport"
    @export="onExport"
    @setting-change="onSettingChange"
    @mode-change="(m) => { activeMode = m; }"
  >
    <template #left-rail>
      <button
        v-for="m in modes"
        :key="m.key"
        class="rail-btn"
        :class="{ active: activeMode === m.key }"
        @click="activeMode = m.key"
      >
        <span class="rail-icon">{{ m.icon }}</span>
        <span class="rail-label">{{ m.label }}</span>
      </button>
    </template>

    <template #right-rail>
      <BatchConfigPanel />
    </template>

    <template #top-actions>
      <label class="toolbar-field toolbar-select-field">
        <span>Scan</span>
        <select v-model="store.scanDirection">
          <option value="horizontal-ltr">L→R</option>
          <option value="horizontal-rtl">R→L</option>
          <option value="vertical-ttb">T→B</option>
          <option value="vertical-btt">B→T</option>
        </select>
      </label>
      <label class="toolbar-field toolbar-select-field">
        <span>Dither</span>
        <select v-model="store.dithering">
          <option value="none">None</option>
          <option value="floyd-steinberg">Floyd</option>
        </select>
      </label>
      <button class="toolbar-import-btn" style="margin-left:8px" @click="store.processAll">⇊ Process All</button>
    </template>

    <template #default>
      <div v-if="activeMode === 'queue'" class="center-stack">
        <BatchFilesTable />
        <BatchResultsPanel />
      </div>
      <div v-else-if="activeMode === 'log'" class="center-stack">
        <BatchFilesTable />
        <BatchLogPanel />
      </div>
      <div v-else class="center-stack">
        <BatchResultsPanel />
      </div>
      <input type="file" class="batch-file-input" style="display:none" accept="image/*" multiple
        @change="loadBatchFiles" />
    </template>

    <template #bottom-extra>
      <span class="export-info">{{ store.summary.completed }}/{{ store.summary.total }} done · {{ store.summary.failed }} failed</span>
    </template>
  </ToolLayout>
</template>

<style scoped>
.center-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.center-stack > :deep(*) {
  flex: 1;
  min-height: 0;
}
</style>
