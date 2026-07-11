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
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function renderHexPreview() {
  const canvas = preview.value;
  if (!canvas) return;
  canvas.width = store.targetWidth;
  canvas.height = store.targetHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.putImageData(store.result.previewImageData, 0, 0);
}

onMounted(renderHexPreview);
watch(() => [store.result, store.targetWidth, store.targetHeight], () => nextTick(renderHexPreview), { deep: true });
</script>

<template>
  <PanelSection class="font-output" step="4" title="Generated Output">
    <template #actions><button class="ghost-primary" @click="copyOutput">⧉ Copy</button><button class="ghost-primary" @click="downloadOutput">⇩ Download</button></template>
    <div class="font-code-shell">
      <ol class="font-line-gutter" aria-hidden="true"><li v-for="line in 10" :key="line">{{ line }}</li></ol>
      <pre class="code-block">{{ store.generatedSource }}</pre>
    </div>
    <aside class="hex-preview font-hex-card">
      <h3><span class="step-badge">5</span> Hex Preview <i>i</i></h3>
      <div class="han-mini font-canvas-wrap adaptive-material-window font-adaptive-window"><canvas ref="preview"></canvas></div>
      <span>{{ store.targetWidth }} x {{ store.targetHeight }} px</span>
    </aside>
  </PanelSection>
</template>
