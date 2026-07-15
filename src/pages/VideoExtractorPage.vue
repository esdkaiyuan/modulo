<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import ToolLayout from '../components/common/ToolLayout.vue';
import VideoWorkspace from '../features/video/components/VideoWorkspace.vue';
import VideoSettings from '../features/video/components/VideoSettings.vue';
import { useVideoModuloStore } from '../features/video/stores/videoModuloStore';
import { buildExport, downloadExport } from '../features/shared/exportVariants';

const store = useVideoModuloStore();

function onImport() {
  document.querySelector<HTMLInputElement>('.video-file-input')?.click();
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ''; // allow re-selecting the same file
  if (file) await store.loadVideoFile(file);
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
    extra: { fps: store.outputFps }
  });
  downloadExport(store.outputName, result);
}

function onSettingChange(key: string, value: unknown) {
  if (key === 'width') store.targetWidth = value as number;
  if (key === 'height') store.targetHeight = value as number;
}

onBeforeUnmount(() => store.pause());
</script>

<template>
  <ToolLayout
    tool="video"
    title="Video to Dot Matrix"
    subtitle="Extract frames from video and convert to dot matrix data"
    :width="store.targetWidth"
    :height="store.targetHeight"
    :code-panel-source="store.generatedSource"
    @import="onImport"
    @export="onExport"
    @setting-change="onSettingChange"
  >
    <template #left-rail>
      <button class="rail-btn active" title="Extract Mode">
        <span class="rail-icon">&#x25D0;</span>
        <span class="rail-label">Extract</span>
      </button>
    </template>

    <template #right-rail>
      <VideoSettings />
    </template>

    <template #default>
      <div class="center-stack">
        <div v-if="store.extractError" class="load-error">{{ store.extractError }}</div>
        <div v-if="store.isExtracting" class="extract-hint">Extracting frames…</div>
        <VideoWorkspace />
      </div>
      <input ref="fileInput" type="file" class="video-file-input" accept="video/*" @change="onFileChange" />
    </template>

    <template #bottom-extra>
      <span class="export-info">{{ store.processedFrames.length }} frames &middot; {{ store.outputFps }} FPS &middot; {{ store.targetWidth }}&times;{{ store.targetHeight }}</span>
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

.video-file-input {
  position: fixed;
  top: -100px;
  left: -100px;
  width: 1px;
  height: 1px;
  opacity: 0;
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

.center-stack > .load-error,
.center-stack > .extract-hint {
  flex: 0 0 auto;
}

.extract-hint {
  padding: 10px 16px;
  border: 1px solid var(--tool-border);
  border-radius: 7px;
  background: var(--tool-surface-strong);
  color: var(--tool-muted);
  font-size: 13px;
  font-weight: 600;
}
</style>
