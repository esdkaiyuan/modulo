<script setup lang="ts">
import { ref } from 'vue';
import ToolLayout from '../components/common/ToolLayout.vue';
import ImageImportPanel from '../features/image/components/ImageImportPanel.vue';
import ImagePreviewPanel from '../features/image/components/ImagePreviewPanel.vue';
import ImageOptionsPanel from '../features/image/components/ImageOptionsPanel.vue';
import ImageOutputPanel from '../features/image/components/ImageOutputPanel.vue';
import { useImageModuloStore } from '../features/image/stores/imageModuloStore';

const store = useImageModuloStore();
const activeMode = ref('convert');

const modes = [
  { key: 'convert', label: 'Convert', icon: '◐' },
  { key: 'crop', label: 'Crop', icon: '⬡' },
  { key: 'color', label: 'Color', icon: '◈' },
];

function onImport() {
  const input = document.querySelector<HTMLInputElement>('.image-file-input');
  input?.click();
}

async function loadImageFile(file: File) {
  const reader = new FileReader();
  reader.onload = async () => {
    const img = new Image();
    img.onload = async () => {
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.canvas.width = img.naturalWidth;
      ctx.canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      store.loadImageData({
        fileName: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type || 'image/*',
        imageData: ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight),
        dataUrl: reader.result as string
      });
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) loadImageFile(file);
}

function onExport(format: string) {
  if (format === 'clipboard') {
    store.outputBlob();
    navigator.clipboard?.writeText(store.generatedSource);
  } else {
    const extensions: Record<string, string> = { c: 'c', txt: 'txt', md: 'md', py: 'py', json: 'json', h: 'h' };
    const url = URL.createObjectURL(store.outputBlob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `${store.generatedName}.${extensions[format] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function onSettingChange(key: string, value: unknown) {
  if (key === 'width') store.targetWidth = value as number;
  if (key === 'height') store.targetHeight = value as number;
}
</script>

<template>
  <ToolLayout
    tool="image"
    title="Image to C Array Converter"
    subtitle="Convert images to C array for embedded systems"
    :width="store.targetWidth"
    :height="store.targetHeight"
    :code-panel-source="store.generatedSource"
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
      <ImageOptionsPanel />
    </template>

    <template #top-actions>
      <label class="toolbar-field toolbar-select-field">
        <span>Color</span>
        <select v-model="store.colorMode">
          <option value="mono">Mono</option>
          <option value="rgb565">RGB565</option>
          <option value="palette16">16-Color</option>
        </select>
      </label>
      <label class="toolbar-field">
        <span>Scale</span>
        <select v-model="store.scalingAlgorithm">
          <option value="nearest">Nearest</option>
          <option value="bilinear">Bilinear</option>
        </select>
      </label>
    </template>

    <template #default>
      <div v-if="activeMode === 'convert'" class="center-stack">
        <ImageImportPanel />
        <ImagePreviewPanel />
        <ImageOutputPanel />
      </div>
      <div v-else-if="activeMode === 'crop'" class="center-stack">
        <ImageImportPanel />
        <ImagePreviewPanel />
      </div>
      <div v-else class="center-stack">
        <ImagePreviewPanel />
      </div>
      <input type="file" class="image-file-input" style="display:none" accept="image/png,image/jpeg,image/webp,image/bmp" @change="onFileChange" />
    </template>

    <template #bottom-extra>
      <span class="export-info">{{ store.bytes.length || Math.ceil(store.totalBits / 8) }} bytes · {{ store.targetWidth }}×{{ store.targetHeight }}</span>
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
