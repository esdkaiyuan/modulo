<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import SizeModeFields from '../components/SizeModeFields.vue';
import ColorModeFields from '../components/ColorModeFields.vue';
import { useImageModuloStore } from '../features/image/stores/imageModuloStore';
import { t } from '../i18n';

const store = useImageModuloStore();
const fileInput = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);
const loadError = ref('');

const hasImage = computed(() => !!store.sourceImageData);
const previewScale = computed(() => {
  const max = Math.max(store.targetWidth, store.targetHeight);
  return max <= 64 ? 5 : max <= 128 ? 3 : 2;
});

// ── File loading ─────────────────────────────────────
function pickFile() {
  fileInput.value?.click();
}

async function loadFile(file: File) {
  loadError.value = '';
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Unable to decode image'));
      img.src = dataUrl;
    });
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
      dataUrl
    });
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Image failed to load';
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) loadFile(file);
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

// ── Auto re-process on settings change (debounced) ───
let timer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => [
    store.targetWidth, store.targetHeight, store.brightness, store.contrast,
    store.threshold, store.dithering, store.scalingAlgorithm, store.colorMode,
    store.colorByteOrder, store.scanDirection, store.bitOrder, store.polarity
  ],
  () => {
    if (!store.sourceImageData) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      store.quickProcess();
    }, 120);
  }
);

onMounted(() => {
  // Plain resize pipeline (no crop) — predictable default for the rebuilt UI.
  store.fixedMode = true;
});

function reset() {
  store.reset();
  loadError.value = '';
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-toolbar">
      <span class="tool-title">{{ t('image.title') }}</span>
      <button class="btn primary" data-test="open-image" @click="pickFile">{{ t('image.open') }}</button>
      <button class="btn" :disabled="!hasImage" @click="reset">{{ t('common.reset') }}</button>
      <span class="toolbar-spacer"></span>
      <span v-if="hasImage" class="toolbar-info">
        {{ store.fileName }} · {{ store.sourceWidth }}×{{ store.sourceHeight }} px ·
        {{ (store.fileSize / 1024).toFixed(1) }} KB ·
        {{ store.detectedColorMode === 'RGB Color' ? t('image.rgbColor') : t('image.grayscale') }}
      </span>
    </div>

    <div class="tool-main">
      <div v-if="loadError" class="alert-error">{{ loadError }}</div>

      <Panel :title="t('image.source')">
        <div
          v-if="!hasImage"
          class="drop-zone"
          :class="{ over: dragOver }"
          @click="pickFile"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
        >
          <span class="big">🖼</span>
          <b>{{ t('image.drop') }}</b>
          <span>{{ t('image.dropTypes') }}</span>
        </div>
        <div v-else class="canvas-frame light">
          <img :src="store.previewUrl" alt="" style="max-width:100%;max-height:320px;image-rendering:auto" />
        </div>
      </Panel>

      <Panel :title="t('image.preview', { w: store.targetWidth, h: store.targetHeight })">
        <div class="canvas-frame">
          <template v-if="hasImage">
            <BitmapCanvas
              :bitmap="store.bitmap"
              :rgba="store.colorMode !== 'mono' ? store.colorPreview : null"
              :width="store.targetWidth"
              :height="store.targetHeight"
              :scale="previewScale"
              :grid="store.colorMode === 'mono' && store.showGrid"
            />
          </template>
          <div v-else class="empty-state">
            <span class="big">▦</span>
            <span>{{ t('image.emptyPreview') }}</span>
          </div>
        </div>
        <div class="media-controls" v-if="hasImage && store.colorMode === 'mono'">
          <label class="check"><input v-model="store.showGrid" type="checkbox" /> {{ t('image.pixelGrid') }}</label>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel :title="t('image.outputSize')">
        <SizeModeFields :store="store" />
      </Panel>

      <Panel :title="t('image.processing')">
        <div class="field-stack">
          <ColorModeFields :store="store" />
          <div class="slider-field">
            <header><span>{{ t('common.brightness') }}</span><b>{{ store.brightness }}</b></header>
            <input v-model.number="store.brightness" type="range" min="-100" max="100" />
          </div>
          <div class="slider-field">
            <header><span>{{ t('common.contrast') }}</span><b>{{ store.contrast.toFixed(2) }}</b></header>
            <input v-model.number="store.contrast" type="range" min="0.2" max="3" step="0.05" />
          </div>
          <div v-if="store.colorMode === 'mono'" class="slider-field">
            <header><span>{{ t('common.threshold') }}</span><b>{{ store.threshold }}</b></header>
            <input v-model.number="store.threshold" type="range" min="0" max="255" />
          </div>
          <div class="field-row">
            <label class="field">
              <span>{{ t('common.scaling') }}</span>
              <select v-model="store.scalingAlgorithm">
                <option value="nearest">{{ t('common.nearest') }}</option>
                <option value="bilinear">{{ t('common.bilinear') }}</option>
              </select>
            </label>
            <label class="field">
              <span>{{ t('common.dithering') }}</span>
              <select v-model="store.dithering">
                <option value="floyd-steinberg">Floyd-Steinberg</option>
                <option value="none">{{ t('common.none') }}</option>
              </select>
            </label>
          </div>
        </div>
      </Panel>

      <Panel v-if="store.colorMode === 'mono'" :title="t('common.encoding')">
        <EncodingFields :store="store" />
      </Panel>

      <Panel :title="t('common.stats')">
        <div class="stat-list">
          <div class="stat-row"><span>{{ t('image.totalBits') }}</span><b>{{ store.totalBits }}</b></div>
          <div class="stat-row"><span>{{ t('image.byteCount') }}</span><b>{{ store.bytes.length }}</b></div>
          <div class="stat-row"><span>{{ t('common.identifier') }}</span><b class="mono">{{ store.generatedName }}</b></div>
        </div>
      </Panel>
    </aside>

    <div class="tool-output">
      <CodeOutput
        :source="hasImage ? store.generatedSource : ''"
        :name="store.generatedName"
        :width="store.targetWidth"
        :height="store.targetHeight"
        :bytes="Array.from(store.bytes)"
      />
    </div>

    <input ref="fileInput" type="file" class="hidden-input" accept="image/png,image/jpeg,image/webp,image/bmp" @change="onFileChange" />
  </div>
</template>
