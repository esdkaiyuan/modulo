<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import { useImageModuloStore } from '../features/image/stores/imageModuloStore';
import { PALETTE_16_COLORS } from '../engines/imageProcessor';

const store = useImageModuloStore();
const fileInput = ref<HTMLInputElement | null>(null);
const colorCanvas = ref<HTMLCanvasElement | null>(null);
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
    store.scanDirection, store.bitOrder, store.polarity
  ],
  () => {
    if (!store.sourceImageData) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      store.quickProcess();
      nextTick(renderColorPreview);
    }, 120);
  }
);

// ── Color preview (rgb565 / palette16) ───────────────
function renderColorPreview() {
  if (store.colorMode === 'mono') return;
  const el = colorCanvas.value;
  const src = store.sourceImageData;
  if (!el || !src) return;
  el.width = src.width;
  el.height = src.height;
  const ctx = el.getContext('2d');
  if (!ctx) return;
  const out = ctx.createImageData(src.width, src.height);

  if (store.colorMode === 'rgb565' && store.colorData.length) {
    const view = new Uint16Array(store.colorData.buffer, store.colorData.byteOffset, store.colorData.length / 2);
    for (let i = 0; i < view.length; i += 1) {
      const v = view[i];
      out.data[i * 4] = ((v >> 11) & 0x1f) << 3;
      out.data[i * 4 + 1] = ((v >> 5) & 0x3f) << 2;
      out.data[i * 4 + 2] = (v & 0x1f) << 3;
      out.data[i * 4 + 3] = 255;
    }
  } else if (store.colorMode === 'palette16' && store.paletteIndex.length) {
    for (let i = 0; i < store.paletteIndex.length; i += 1) {
      const [r, g, b] = PALETTE_16_COLORS[store.paletteIndex[i]] ?? [0, 0, 0];
      out.data[i * 4] = r;
      out.data[i * 4 + 1] = g;
      out.data[i * 4 + 2] = b;
      out.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

watch(() => [store.colorMode, store.colorData, store.paletteIndex], () => nextTick(renderColorPreview));

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
      <span class="tool-title">▣ Image Converter</span>
      <button class="btn primary" data-test="open-image" @click="pickFile">Open Image</button>
      <button class="btn" :disabled="!hasImage" @click="reset">Reset</button>
      <span class="toolbar-spacer"></span>
      <span v-if="hasImage" class="toolbar-info">
        {{ store.fileName }} · {{ store.sourceWidth }}×{{ store.sourceHeight }} px ·
        {{ (store.fileSize / 1024).toFixed(1) }} KB · {{ store.detectedColorMode }}
      </span>
    </div>

    <div class="tool-main">
      <div v-if="loadError" class="alert-error">{{ loadError }}</div>

      <Panel title="Source Image">
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
          <b>Drop an image here, or click to browse</b>
          <span>PNG · JPG · BMP · WebP</span>
        </div>
        <div v-else class="canvas-frame light">
          <img :src="store.previewUrl" alt="" style="max-width:100%;max-height:320px;image-rendering:auto" />
        </div>
      </Panel>

      <Panel :title="`Dot Matrix Preview (${store.targetWidth}×${store.targetHeight})`">
        <div class="canvas-frame">
          <template v-if="hasImage">
            <BitmapCanvas
              v-if="store.colorMode === 'mono'"
              :bitmap="store.bitmap"
              :width="store.targetWidth"
              :height="store.targetHeight"
              :scale="previewScale"
              :grid="store.showGrid"
            />
            <canvas v-else ref="colorCanvas" style="max-width:100%;max-height:340px"></canvas>
          </template>
          <div v-else class="empty-state">
            <span class="big">▦</span>
            <span>Load an image to generate the dot matrix preview</span>
          </div>
        </div>
        <div class="media-controls" v-if="hasImage && store.colorMode === 'mono'">
          <label class="check"><input v-model="store.showGrid" type="checkbox" /> Pixel grid</label>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel title="Output Size">
        <div class="field-row">
          <label class="field"><span>Width</span><input v-model.number="store.targetWidth" type="number" min="8" max="512" /></label>
          <label class="field"><span>Height</span><input v-model.number="store.targetHeight" type="number" min="8" max="512" /></label>
        </div>
      </Panel>

      <Panel title="Processing">
        <div class="field-stack">
          <label class="field">
            <span>Color Mode</span>
            <select v-model="store.colorMode">
              <option value="mono">Monochrome (1bpp)</option>
              <option value="rgb565">RGB565 (16-bit)</option>
              <option value="palette16">16-Color Palette (4bpp)</option>
            </select>
          </label>
          <div class="slider-field">
            <header><span>Brightness</span><b>{{ store.brightness }}</b></header>
            <input v-model.number="store.brightness" type="range" min="-100" max="100" />
          </div>
          <div class="slider-field">
            <header><span>Contrast</span><b>{{ store.contrast.toFixed(2) }}</b></header>
            <input v-model.number="store.contrast" type="range" min="0.2" max="3" step="0.05" />
          </div>
          <div class="slider-field">
            <header><span>Threshold</span><b>{{ store.threshold }}</b></header>
            <input v-model.number="store.threshold" type="range" min="0" max="255" />
          </div>
          <div class="field-row">
            <label class="field">
              <span>Scaling</span>
              <select v-model="store.scalingAlgorithm">
                <option value="nearest">Nearest</option>
                <option value="bilinear">Bilinear</option>
              </select>
            </label>
            <label class="field">
              <span>Dithering</span>
              <select v-model="store.dithering">
                <option value="floyd-steinberg">Floyd-Steinberg</option>
                <option value="none">None</option>
              </select>
            </label>
          </div>
        </div>
      </Panel>

      <Panel title="Encoding">
        <EncodingFields :store="store" />
      </Panel>

      <Panel title="Stats">
        <div class="stat-list">
          <div class="stat-row"><span>Total bits</span><b>{{ store.totalBits }}</b></div>
          <div class="stat-row"><span>Bytes</span><b>{{ store.bytes.length }}</b></div>
          <div class="stat-row"><span>Identifier</span><b class="mono">{{ store.generatedName }}</b></div>
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
