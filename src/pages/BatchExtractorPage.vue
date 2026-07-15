<script setup lang="ts">
import { computed, ref } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import { useBatchModuloStore } from '../features/batch/stores/batchModuloStore';

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
      <span class="tool-title">≣ Batch Processor</span>
      <button class="btn primary" data-test="add-images" @click="pickFiles">＋ Add Images</button>
      <button class="btn" data-test="start-batch" :disabled="!store.items.length" @click="store.processAll()">▶ Process All</button>
      <button class="btn danger" :disabled="!store.items.length" @click="store.clearAll()">✕ Clear All</button>
      <span class="toolbar-spacer"></span>
      <span class="toolbar-info">
        {{ store.summary.completed }}/{{ store.summary.total }} done
        <template v-if="store.summary.failed"> · {{ store.summary.failed }} failed</template>
        · {{ store.overallProgress }}%
      </span>
    </div>

    <div class="tool-main">
      <Panel :title="`Input Files (${store.items.length})`">
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
          <b>Drop images here, or click to browse</b>
          <span>Multiple PNG / JPG / BMP / WebP files</span>
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
              <th>File</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Size</th>
              <th>Actions</th>
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
                <span class="pill" :class="item.status">{{ item.status }}</span>
              </td>
              <td>
                <span class="progress-track"><i :style="{ width: `${item.progress}%` }"></i></span>{{ item.progress }}%
              </td>
              <td>{{ formatSize(item.size) }}</td>
              <td>
                <button v-if="item.status === 'error'" class="btn sm" :title="item.error" @click.stop="store.retryItem(item.id)">Retry</button>
                <button class="btn sm danger" @click.stop="store.removeItem(item.id)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <Panel :title="store.selectedItem ? `Preview — ${store.selectedItem.fileName}` : 'Preview'">
        <div class="canvas-frame">
          <BitmapCanvas
            v-if="store.selectedItem && store.selectedItem.status === 'done'"
            :bitmap="store.selectedItem.bitmap"
            :width="store.targetWidth"
            :height="store.targetHeight"
            :scale="Math.max(store.targetWidth, store.targetHeight) <= 64 ? 4 : 2"
          />
          <div v-else class="empty-state">
            <span class="big">▦</span>
            <span>{{ store.items.length ? 'Process the queue to preview results' : 'Add images to start batch extraction' }}</span>
          </div>
        </div>
      </Panel>

      <Panel v-if="store.logs.length" title="Process Log">
        <ul class="log-list">
          <li v-for="(line, index) in store.logs" :key="index">{{ line }}</li>
        </ul>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel title="Shared Parameters">
        <div class="field-stack">
          <div class="field-row">
            <label class="field"><span>Width</span><input v-model.number="store.targetWidth" type="number" min="8" max="512" /></label>
            <label class="field"><span>Height</span><input v-model.number="store.targetHeight" type="number" min="8" max="512" /></label>
          </div>
          <div class="slider-field">
            <header><span>Threshold</span><b>{{ store.threshold }}</b></header>
            <input v-model.number="store.threshold" type="range" min="0" max="255" />
          </div>
          <div class="slider-field">
            <header><span>Brightness</span><b>{{ store.brightness }}</b></header>
            <input v-model.number="store.brightness" type="range" min="-100" max="100" />
          </div>
          <label class="field">
            <span>Dithering</span>
            <select v-model="store.dithering">
              <option value="floyd-steinberg">Floyd-Steinberg</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>
      </Panel>

      <Panel title="Encoding">
        <EncodingFields :store="store" />
      </Panel>

      <Panel title="Summary Statistics">
        <div class="stat-list">
          <div class="stat-row"><span>Total files</span><b>{{ store.summary.total }}</b></div>
          <div class="stat-row"><span>Completed</span><b>{{ store.summary.completed }}</b></div>
          <div class="stat-row"><span>Failed</span><b>{{ store.summary.failed }}</b></div>
          <div class="stat-row"><span>Pending</span><b>{{ store.summary.pending }}</b></div>
        </div>
      </Panel>

      <Panel title="Re-run">
        <button class="btn primary" style="width:100%" :disabled="!store.items.length" @click="store.reprocessAll()">
          ⇊ Apply Settings to All
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
        title="Merged Output"
      />
    </div>

    <input ref="fileInput" type="file" class="hidden-input" accept="image/png,image/jpeg,image/webp,image/bmp" multiple @change="onFileChange" />
  </div>
</template>
