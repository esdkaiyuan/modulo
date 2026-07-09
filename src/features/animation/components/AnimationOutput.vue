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
  <PanelSection class="media-output" title="Generated Code">
    <template #actions><button class="ghost-btn" @click="copyCode">⧉ Copy Code</button><button class="ghost-btn" @click="downloadCode">⇩ Download .h</button></template>
    <pre class="code-block">{{ store.generatedSource }}</pre>
    <div class="black-player small animation-canvas" :class="{ 'sample-preview': !store.selectedFrame }">
      <canvas v-if="store.selectedFrame" ref="preview"></canvas>
      <AnimationPixelSample v-else variant="output" :frame="3" />
    </div>
  </PanelSection>
</template>
