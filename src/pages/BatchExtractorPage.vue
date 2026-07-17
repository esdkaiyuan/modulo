<script setup lang="ts">
import { computed, ref } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import SizeModeFields from '../components/SizeModeFields.vue';
import ColorModeFields from '../components/ColorModeFields.vue';
import { useBatchModuloStore } from '../features/batch/stores/batchModuloStore';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/messages';

const store = useBatchModuloStore();
const fileInput = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);

const doneFrames = computed(() =>
  store.items.filter((item) => item.status === 'done').map((item) => Array.from(item.bytes))
);

function pickFiles() {
  fileInput.value?.click();
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function decodeImage(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas 2D is unavailable'));
        return;
      }
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    };
    image.onerror = () => reject(new Error('Unable to decode image'));
    image.src = dataUrl;
  });
}

async function addFiles(files: FileList | File[] | null) {
  if (!files) return;
  for (const file of Array.from(files)) {
    try {
      const dataUrl = await readAsDataUrl(file);
      const imageData = await decodeImage(dataUrl);
      store.addImageData({
        fileName: file.name,
        size: file.size,
        type: file.type || 'image/*',
        imageData,
        dataUrl
      });
    } catch {
      // Skip unreadable files instead of aborting the whole batch.
    }
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  addFiles(input.files);
  input.value = '';
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  addFiles(e.dataTransfer?.files ?? null);
}

function formatSize(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-toolbar">
      <span class="tool-title">{{ t('batch.title') }}</span>
      <button class="btn primary" data-test="add-images" @click="pickFiles">{{ t('batch.add') }}</button>
      <button class="btn" data-test="start-batch" :disabled="!store.items.length" @click="store.processAll()">{{ t('batch.processAll') }}</button>
      <button class="btn danger" :disabled="!store.items.length" @click="store.clearAll()">{{ t('batch.clearAll') }}</button>
      <span class="toolbar-spacer"></span>
      <span class="toolbar-info">
        {{ store.summary.completed }}/{{ store.summary.total }} {{ t('batch.done') }}
        <template v-if="store.summary.failed"> · {{ store.summary.failed }} {{ t('batch.failed') }}</template>
        · {{ store.overallProgress }}%
      </span>
    </div>

    <div class="tool-main">
      <Panel :title="t('batch.inputFiles', { n: store.items.length })">
        <div
          v-if="!store.items.length"
          class="drop-zone"
          :class="{ over: dragOver }"
          @click="pickFiles"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
        >
          <span class="big">🗂</span>
          <b>{{ t('batch.drop') }}</b>
          <span>{{ t('batch.dropTypes') }}</span>
        </div>
        <table v-else class="data-table">
          <colgroup>
            <col />
            <col style="width: 92px" />
            <col style="width: 130px" />
            <col style="width: 80px" />
            <col style="width: 120px" />
          </colgroup>
          <thead>
            <tr>
              <th>{{ t('batch.thFile') }}</th>
              <th>{{ t('batch.thStatus') }}</th>
              <th>{{ t('batch.thProgress') }}</th>
              <th>{{ t('batch.thSize') }}</th>
              <th>{{ t('batch.thActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in store.items"
              :key="item.id"
              :class="{ selected: store.selectedId === item.id }"
              @click="store.selectedId = item.id"
            >
              <td>
                <img v-if="item.dataUrl" class="mini-thumb" :src="item.dataUrl" alt="" />
                {{ item.fileName }}
              </td>
              <td>
                <span class="pill" :class="item.status">{{ t(`batch.status.${item.status}` as MessageKey) }}</span>
              </td>
              <td>
                <span class="progress-track"><i :style="{ width: `${item.progress}%` }"></i></span>{{ item.progress }}%
              </td>
              <td>{{ formatSize(item.size) }}</td>
              <td>
                <button v-if="item.status === 'error'" class="btn sm" :title="item.error" @click.stop="store.retryItem(item.id)">{{ t('batch.retry') }}</button>
                <button class="btn sm danger" @click.stop="store.removeItem(item.id)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <Panel :title="store.selectedItem ? `${t('common.preview')} — ${store.selectedItem.fileName}` : t('common.preview')">
        <div class="canvas-frame">
          <BitmapCanvas
            v-if="store.selectedItem && store.selectedItem.status === 'done'"
            :bitmap="store.selectedItem.bitmap"
            :rgba="store.selectedItem.preview ?? null"
            :width="store.selectedItem.outputWidth"
            :height="store.selectedItem.outputHeight"
            :scale="Math.max(store.selectedItem.outputWidth, store.selectedItem.outputHeight) <= 64 ? 4 : 2"
          />
          <div v-else class="empty-state">
            <span class="big">▦</span>
            <span>{{ store.items.length ? t('batch.previewHint') : t('batch.emptyHint') }}</span>
          </div>
        </div>
      </Panel>

      <Panel v-if="store.logs.length" :title="t('batch.log')">
        <ul class="log-list">
          <li v-for="(line, index) in store.logs" :key="index">{{ line }}</li>
        </ul>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel :title="t('batch.sharedParams')">
        <div class="field-stack">
          <SizeModeFields :store="store" variant="per-item" />
          <ColorModeFields :store="store" />
          <div v-if="store.colorMode === 'mono'" class="slider-field">
            <header><span>{{ t('common.threshold') }}</span><b>{{ store.threshold }}</b></header>
            <input v-model.number="store.threshold" type="range" min="0" max="255" />
          </div>
          <div class="slider-field">
            <header><span>{{ t('common.brightness') }}</span><b>{{ store.brightness }}</b></header>
            <input v-model.number="store.brightness" type="range" min="-100" max="100" />
          </div>
          <label class="field">
            <span>{{ t('common.dithering') }}</span>
            <select v-model="store.dithering">
              <option value="floyd-steinberg">Floyd-Steinberg</option>
              <option value="none">{{ t('common.none') }}</option>
            </select>
          </label>
        </div>
      </Panel>

      <Panel v-if="store.colorMode === 'mono'" :title="t('common.encoding')">
        <EncodingFields :store="store" />
      </Panel>

      <Panel :title="t('batch.summary')">
        <div class="stat-list">
          <div class="stat-row"><span>{{ t('batch.totalFiles') }}</span><b>{{ store.summary.total }}</b></div>
          <div class="stat-row"><span>{{ t('batch.completed') }}</span><b>{{ store.summary.completed }}</b></div>
          <div class="stat-row"><span>{{ t('batch.failedCount') }}</span><b>{{ store.summary.failed }}</b></div>
          <div class="stat-row"><span>{{ t('batch.pendingCount') }}</span><b>{{ store.summary.pending }}</b></div>
        </div>
      </Panel>

      <Panel :title="t('batch.rerun')">
        <button class="btn primary" style="width:100%" :disabled="!store.items.length" @click="store.reprocessAll()">
          {{ t('batch.applyAll') }}
        </button>
      </Panel>
    </aside>

    <div class="tool-output">
      <CodeOutput
        :source="store.mergedSource"
        name="batch_results"
        :width="store.targetWidth"
        :height="store.targetHeight"
        :frames="doneFrames"
        :extra="{ files: doneFrames.length }"
        :title="t('batch.mergedOutput')"
      />
    </div>

    <input ref="fileInput" type="file" class="hidden-input" accept="image/png,image/jpeg,image/webp,image/bmp" multiple @change="onFileChange" />
  </div>
</template>
