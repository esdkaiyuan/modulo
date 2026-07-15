<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useAnimationModuloStore } from '../stores/animationModuloStore';
import AnimationPixelSample from './AnimationPixelSample.vue';

const store = useAnimationModuloStore();
const preview = ref<HTMLCanvasElement | null>(null);

async function copyCode() {
  await navigator.clipboard?.writeText(store.generatedSource);
}

function downloadCode() {
  const url = URL.createObjectURL(store.outputBlob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = store.outputFileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderPreview() {
  const canvas = preview.value;
  const frame = store.selectedFrame;
  if (!canvas || !frame) return;
  canvas.width = store.targetWidth;
  canvas.height = store.targetHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  const image = context.createImageData(store.targetWidth, store.targetHeight);
  for (let index = 0; index < frame.bitmap.length; index += 1) {
    const offset = index * 4;
    const value = frame.bitmap[index] ? 0 : 255;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

onMounted(renderPreview);
watch(() => [store.selectedIndex, store.selectedFrame?.bitmap, store.targetWidth, store.targetHeight], () => nextTick(renderPreview), { deep: true });
</script>

<template>
  <section class="animation-output-row">
    <PanelSection class="media-output" title="Output Stats">
      <template #actions>
        <button class="ghost-btn" @click="copyCode">Copy</button>
        <button class="ghost-btn" @click="downloadCode">Download</button>
      </template>
      <footer class="animation-output-stats">
        <span>Frames: {{ store.processedFrames.length }}</span>
        <span>Resolution: {{ store.targetWidth }} x {{ store.targetHeight }}</span>
        <span>BPP: 1</span>
        <span>Data Size: {{ store.processedFrames.length ? ((store.bytesPerFrame * store.processedFrames.length) / 1024).toFixed(2) : '0.00' }} KB</span>
        <span>Total Duration: {{ (store.totalDuration / 1000).toFixed(2) }} s</span>
      </footer>
    </PanelSection>

    <PanelSection class="animation-preview-panel" title="Selected Frame">
      <div class="black-player small animation-canvas animation-adaptive-window adaptive-material-window" :class="{ 'sample-preview': !store.selectedFrame }">
        <canvas v-if="store.selectedFrame" ref="preview"></canvas>
        <AnimationPixelSample v-else variant="output" :frame="3" />
      </div>
      <div class="media-controls animation-playback-controls">
        <span><strong>{{ store.processedFrames.length ? store.selectedIndex + 1 : 0 }} / {{ store.processedFrames.length }}</strong></span>
        <span>{{ store.selectedFrame?.delay ?? 0 }} ms/frame</span>
        <input v-model.number="store.selectedIndex" type="range" :max="Math.max(0, store.processedFrames.length - 1)" min="0" />
      </div>
    </PanelSection>
  </section>
</template>
