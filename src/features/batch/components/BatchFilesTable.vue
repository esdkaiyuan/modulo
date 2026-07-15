<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { useBatchModuloStore } from '../stores/batchModuloStore';
import BatchPixelSample from './BatchPixelSample.vue';

const store = useBatchModuloStore();

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

async function addFiles(files: FileList | null, inputEl?: HTMLInputElement) {
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
  if (inputEl) inputEl.value = ''; // allow re-selecting the same files
}

function formatSize(bytes: number) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}
</script>

<template>
  <PanelSection class="batch-files" step="1" title="Input Files">
    <template #actions>
      <label class="ghost-btn batch-upload">＋ Add Images<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/bmp" @change="addFiles(($event.target as HTMLInputElement).files, $event.target as HTMLInputElement)" /></label>
      <button class="ghost-btn" :disabled="!store.items.length" @click="store.clearAll">✕ Clear All</button>
      <button class="primary-btn" data-test="start-batch" @click="store.processAll">▶ Start Batch</button>
    </template>
    <table class="file-table">
      <thead>
        <tr>
          <th>File Name</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in store.items" :key="item.id" :class="{ selected: store.selectedId === item.id }" @click="store.selectedId = item.id">
          <td><img v-if="item.dataUrl" class="mini-image" :src="item.dataUrl" alt="" /><span v-else class="mini-image"></span>{{ item.fileName }}</td>
          <td><span class="status-pill" :class="item.status">{{ item.status }}</span><small v-if="item.error" class="row-error">{{ item.error }}</small></td>
          <td><span class="progress"><i :style="{ width: `${item.progress}%` }"></i></span>{{ item.progress }}%</td>
          <td>{{ formatSize(item.size) }}</td>
          <td>
            <button v-if="item.status === 'error'" class="ghost-primary" @click.stop="store.retryItem(item.id)">Retry</button>
            <button class="link-danger" @click.stop="store.removeItem(item.id)">Remove</button>
          </td>
        </tr>
        <tr v-if="store.items.length === 0">
          <td colspan="5" class="empty-row">
            <div class="batch-empty-state">
              <BatchPixelSample variant="queue" compact />
              <span>Add images to start batch extraction.</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <footer class="table-footer">Showing {{ store.items.length }} files <span>Completed {{ store.summary.completed }} / {{ store.summary.total }}</span></footer>
  </PanelSection>
</template>

<style scoped>
.row-error {
  display: block;
  color: #b91c1c;
  font-size: 10px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-table {
  width: 100%;
  table-layout: fixed;
}

.file-table td {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
