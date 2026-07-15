<script setup lang="ts">
import { onMounted, ref } from 'vue';
import ToolLayout from '../components/common/ToolLayout.vue';
import FontInputPanel from '../features/font/components/FontInputPanel.vue';
import FontPreviewPanel from '../features/font/components/FontPreviewPanel.vue';
import FontOptionsPanel from '../features/font/components/FontOptionsPanel.vue';
import FontOutputPanel from '../features/font/components/FontOutputPanel.vue';
import { useFontModuloStore } from '../features/font/stores/fontModuloStore';
import { buildExport, downloadExport } from '../features/shared/exportVariants';

const store = useFontModuloStore();
const activeMode = ref('input');

const modes = [
  { key: 'input', label: 'Input', icon: '◐' },
  { key: 'preview', label: 'Preview', icon: '▦' },
  { key: 'output', label: 'Output', icon: '⌘' },
];

onMounted(() => {
  // Render the default text immediately so preview/output aren't empty.
  if (!store.bytes.length) store.generate();
});

function onExport(format: string) {
  if (format === 'clipboard') {
    navigator.clipboard?.writeText(store.generatedSource);
    return;
  }
  const payload = store.glyphs.length > 1
    ? { frames: store.glyphs.map((g) => Array.from(g.bytes)) }
    : { bytes: Array.from(store.bytes) };
  const result = buildExport(format, {
    name: store.outputName,
    source: store.generatedSource,
    ...payload,
    width: store.targetWidth,
    height: store.targetHeight,
    extra: { text: store.text }
  });
  downloadExport(store.outputName, result);
}

function onSettingChange(key: string, value: unknown) {
  if (key === 'width') store.targetWidth = value as number;
  if (key === 'height') store.targetHeight = value as number;
}
</script>

<template>
  <ToolLayout
    tool="font"
    title="PixelFont Extractor"
    subtitle="Chinese Character Dot Matrix Generator for Embedded Systems"
    :width="store.targetWidth"
    :height="store.targetHeight"
    :show-import="false"
    :code-panel-source="store.generatedSource"
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
      <FontOptionsPanel />
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
      <label class="toolbar-field">
        <span>Size</span>
        <select v-model.number="store.fontSize">
          <option :value="16">16px</option>
          <option :value="32">32px</option>
          <option :value="48">48px</option>
          <option :value="64">64px</option>
        </select>
      </label>
    </template>

    <template #default>
      <div class="center-stack">
        <FontInputPanel v-if="activeMode === 'input' || activeMode === 'preview'" />
        <FontPreviewPanel />
        <FontOutputPanel v-if="activeMode === 'output'" />
      </div>
    </template>

    <template #bottom-extra>
      <span class="export-info">{{ store.totalBits }} bits · {{ store.targetWidth }}×{{ store.targetHeight }}</span>
    </template>
  </ToolLayout>
</template>

<style scoped>
.center-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}
</style>
