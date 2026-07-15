<script setup lang="ts">
import { ref } from 'vue';
import ToolLayout from '../components/common/ToolLayout.vue';
import AnimationWorkspace from '../features/animation/components/AnimationWorkspace.vue';
import AnimationSettings from '../features/animation/components/AnimationSettings.vue';
import AnimationOutput from '../features/animation/components/AnimationOutput.vue';
import { useAnimationModuloStore } from '../features/animation/stores/animationModuloStore';
import { decodeGif } from '../features/animation/utils/gifDecoder';
import { buildExport, downloadExport } from '../features/shared/exportVariants';

const store = useAnimationModuloStore();
const activeMode = ref('frames');
const loadError = ref('');

const modes = [
  { key: 'frames', label: 'Frames', icon: '◐' },
  { key: 'output', label: 'Output', icon: '⌘' },
];

function onImport() {
  document.querySelector<HTMLInputElement>('.animation-file-input')?.click();
}

async function loadAnimationFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ''; // allow re-selecting the same file
  if (!file) return;
  loadError.value = '';
  try {
    const decoded = decodeGif(await file.arrayBuffer());
    if (!decoded.frames.length) throw new Error('No frames found in this GIF');
    store.loadDecodedFrames({ fileName: file.name, width: decoded.width, height: decoded.height, frames: decoded.frames });
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to decode GIF file';
  }
}

function onExport(format: string) {
  if (format === 'clipboard') {
    navigator.clipboard?.writeText(store.generatedSource);
    return;
  }
  const result = buildExport(format, {
    name: store.outputName,
    source: store.generatedSource,
    frames: store.processedFrames.map((f) => Array.from(f.bytes)),
    width: store.targetWidth,
    height: store.targetHeight,
    extra: { delays: store.delayTable }
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
    tool="animation"
    title="DotMatrix Frame Extractor"
    subtitle="Extract frames from animations and generate embedded-ready data"
    :width="store.targetWidth"
    :height="store.targetHeight"
    :code-panel-source="store.generatedSource"
    @import="onImport"
    @export="onExport"
    @setting-change="onSettingChange"
    @mode-change="(m: string) => { activeMode = m; }"
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
      <AnimationSettings />
    </template>

    <template #top-actions>
      <label class="toolbar-field toolbar-select-field">
        <span>Dither</span>
        <select v-model="store.dithering">
          <option value="none">None</option>
          <option value="floyd-steinberg">Floyd</option>
        </select>
      </label>
      <label class="toolbar-field toolbar-select-field">
        <span>Scan</span>
        <select v-model="store.scanDirection">
          <option value="horizontal-ltr">L→R</option>
          <option value="horizontal-rtl">R→L</option>
          <option value="vertical-ttb">T→B</option>
          <option value="vertical-btt">B→T</option>
        </select>
      </label>
    </template>

    <template #default>
      <div class="center-stack">
        <div v-if="loadError" class="load-error">{{ loadError }}</div>
        <AnimationWorkspace />
        <AnimationOutput v-if="activeMode === 'output'" />
      </div>
      <input type="file" class="animation-file-input" style="display:none" accept="image/gif" @change="loadAnimationFile" />
    </template>

    <template #bottom-extra>
      <span class="export-info">{{ store.processedFrames.length }} frames · {{ store.targetWidth }}×{{ store.targetHeight }}</span>
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

.center-stack > .load-error {
  flex: 0 0 auto;
}

.load-error {
  padding: 10px 16px;
  border: 1px solid #fca5a5;
  border-radius: 7px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 600;
}
</style>
