<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import ToolLayout from '../components/common/ToolLayout.vue';
import PixelCanvas from '../features/handdraw/components/PixelCanvas.vue';
import RightPanel from '../features/handdraw/components/RightPanel.vue';
import OutputPanel from '../features/handdraw/components/OutputPanel.vue';
import { usePixelStore } from '../stores/pixelStore';
import { buildExport, downloadExport } from '../features/shared/exportVariants';

const store = usePixelStore();

const tools = [
  { key: 'pencil', label: 'Pencil', icon: '✎' },
  { key: 'eraser', label: 'Eraser', icon: '⌫' },
  { key: 'fill', label: 'Fill', icon: '◉' },
  { key: 'eyedropper', label: 'Picker', icon: '⌖' },
] as const;

function onExport(format: string) {
  if (format === 'clipboard') {
    navigator.clipboard?.writeText(store.currentOutput);
    return;
  }
  if (format === 'c' || format === 'h' || format === 'txt') {
    // Respect the selected output format (c-array/hex/bin) for direct downloads.
    const url = URL.createObjectURL(store.outputBlob());
    const a = document.createElement('a');
    a.href = url;
    a.download = store.outputFileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const result = buildExport(format, {
    name: `image_${store.width}x${store.height}`,
    source: store.cArrayOutput,
    bytes: Array.from(store.byteOutput),
    width: store.width,
    height: store.height
  });
  downloadExport(`image_${store.width}x${store.height}`, result);
}

function onSettingChange(key: string, value: unknown) {
  // Canvas is square; either dimension sets the size.
  if (key === 'width' || key === 'height') store.setCanvasSize(value as number);
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) store.redo(); else store.undo();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    store.redo();
  } else if (e.key === 'b') store.setTool('pencil');
  else if (e.key === 'e') store.setTool('eraser');
  else if (e.key === 'g') store.setTool('fill');
  else if (e.key === 'i') store.setTool('eyedropper');
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <ToolLayout
    tool="pixel"
    title="Pixel Editor"
    subtitle="Create and edit pixel art with C array export"
    :width="store.width"
    :height="store.height"
    :show-import="false"
    :code-panel-source="store.cArrayOutput"
    @export="onExport"
    @setting-change="onSettingChange"
  >
    <template #left-rail>
      <div class="rail-tool-section">
        <span class="rail-section-title">Tools</span>
        <button
          v-for="tool in tools"
          :key="tool.key"
          class="rail-btn"
          :class="{ active: store.activeTool === tool.key }"
          @click="store.setTool(tool.key)"
          :title="tool.label"
        >
          <span class="rail-icon">{{ tool.icon }}</span>
          <span class="rail-label">{{ tool.label }}</span>
        </button>
      </div>
      <div class="rail-divider"></div>
      <div class="rail-tool-section">
        <span class="rail-section-title">Edit</span>
        <button class="rail-btn" :disabled="!store.canUndo" @click="store.undo()" title="Undo (Ctrl+Z)">
          <span class="rail-icon">↶</span>
          <span class="rail-label">Undo</span>
        </button>
        <button class="rail-btn" :disabled="!store.canRedo" @click="store.redo()" title="Redo (Ctrl+Y)">
          <span class="rail-icon">↷</span>
          <span class="rail-label">Redo</span>
        </button>
        <button class="rail-btn" @click="store.clearCanvas()" title="Clear canvas">
          <span class="rail-icon">✕</span>
          <span class="rail-label">Clear</span>
        </button>
      </div>
    </template>

    <template #right-rail>
      <RightPanel />
    </template>

    <template #top-actions>
      <label class="toolbar-field toolbar-select-field">
        <span>Canvas</span>
        <select :value="store.width" @change="store.setCanvasSize(Number(($event.target as HTMLSelectElement).value))">
          <option :value="16">16×16</option>
          <option :value="32">32×32</option>
          <option :value="64">64×64</option>
        </select>
      </label>
      <label class="toolbar-field">
        <span>Zoom</span>
        <input type="number" min="200" max="1200" step="50" :value="store.zoom"
          @change="(e) => store.zoom = Number((e.target as HTMLInputElement).value)" />
        <span>%</span>
      </label>
      <label class="toolbar-field" style="gap:4px">
        <input type="checkbox" v-model="store.showGrid" />
        <span>Grid</span>
      </label>
    </template>

    <template #default>
      <div class="pixel-center">
        <PixelCanvas />
        <OutputPanel />
      </div>
    </template>

    <template #bottom-extra>
      <span class="export-info">{{ store.width }}×{{ store.height }} · {{ store.pixels.filter(Boolean).length }} pixels</span>
    </template>
  </ToolLayout>
</template>

<style scoped>
.pixel-center {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1;
}

.pixel-center > :deep(*) {
  flex: 1;
  min-height: 0;
}

.rail-tool-section {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  width: 100%;
}

.rail-section-title {
  font-size: 9px;
  font-weight: 700;
  color: var(--tool-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  text-align: center;
}

.rail-tool-section .rail-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
