<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { useImageModuloStore } from '../stores/imageModuloStore';
import ImagePixelSample from './ImagePixelSample.vue';

const store = useImageModuloStore();

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

async function loadFile(file: File) {
  const dataUrl = await readAsDataUrl(file);
  const imageData = await decodeImage(dataUrl);
  store.loadImageData({
    fileName: file.name,
    width: imageData.width,
    height: imageData.height,
    size: file.size,
    type: file.type || 'image/*',
    imageData,
    dataUrl
  });
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) await loadFile(file);
}

async function handleDrop(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files[0];
  if (file) await loadFile(file);
}

function formatSize(bytes: number) {
  if (!bytes) return '0 KB';
  return `${(bytes / 1024).toFixed(2)} KB`;
}
</script>

<template>
  <PanelSection class="image-import" step="1" title="Import Image">
    <label class="drop-zone image-adaptive-window adaptive-material-window" @dragover.prevent @drop="handleDrop">
      <input class="file-input" type="file" accept="image/png,image/jpeg,image/webp,image/bmp" @change="handleFileChange" />
      <strong>☁ Drop image here or click to browse</strong>
      <span><b>PNG</b><b>JPG</b><b>BMP</b><b>WEBP</b></span>
    </label>
    <div class="image-actions"><button class="ghost-primary">⌗ Crop</button><button class="ghost-btn" @click="store.reset">↺ Reset</button></div>
    <img v-if="store.previewUrl" class="loaded-image image-adaptive-window adaptive-material-window" :src="store.previewUrl" alt="Loaded source" />
    <div v-else class="loaded-image sample-holder image-adaptive-window adaptive-material-window"><ImagePixelSample variant="source" compact /></div>
    <div class="image-meta">
      <strong>{{ store.fileName || 'panda_128x64.png' }}</strong>
      <span>Dimensions: {{ store.sourceWidth || '-' }} × {{ store.sourceHeight || '-' }} px</span>
      <span>File Size: {{ formatSize(store.fileSize) }}</span>
      <span>Type: {{ store.fileType ? store.fileType.split('/').pop()?.toUpperCase() : 'PNG' }}</span>
      <span>Color: Grayscale</span>
      <span :class="store.fileName ? 'ok' : 'tag'">{{ store.fileName ? '✓ Image loaded' : 'Waiting for image' }}</span>
    </div>
  </PanelSection>
</template>
