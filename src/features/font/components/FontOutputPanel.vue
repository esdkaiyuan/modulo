<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useFontModuloStore } from '../stores/fontModuloStore';

const store = useFontModuloStore();
const preview = ref<HTMLCanvasElement | null>(null);

async function copyOutput() {
  await navigator.clipboard?.writeText(store.generatedSource);
}

function downloadOutput() {
  const url = URL.createObjectURL(store.outputBlob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = store.outputFileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function renderHexPreview() {
  const canvas = preview.value;
  if (!canvas) return;
  canvas.width = store.targetWidth;
  canvas.height = store.targetHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  const image = context.createImageData(store.targetWidth, store.targetHeight);
  for (let index = 0; index < store.bitmap.length; index += 1) {
    const offset = index * 4;
    const value = store.bitmap[index] ? 0 : 255;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

onMounted(renderHexPreview);
watch(() => [store.bitmap, store.targetWidth, store.targetHeight], () => nextTick(renderHexPreview), { deep: true });
</script>

<template>
  <PanelSection class="font-output" step="4" title="Generated Output">
    <template #actions><button class="ghost-primary" @click="copyOutput">⧉ Copy</button><button class="ghost-primary" @click="downloadOutput">⇩ Download</button></template>
    <pre class="code-block">{{ store.generatedSource }}</pre>
    <aside class="hex-preview"><h3>Hex Preview</h3><div class="han-mini font-canvas-wrap"><canvas ref="preview"></canvas></div><span>{{ store.targetWidth }} x {{ store.targetHeight }} px</span></aside>
  </PanelSection>
</template>
