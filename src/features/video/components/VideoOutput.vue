<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useVideoModuloStore } from '../stores/videoModuloStore';
import VideoPixelSample from './VideoPixelSample.vue';

const store = useVideoModuloStore();
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

function renderPreview() {
  const canvas = preview.value;
  const frame = store.selectedFrame;
  if (!canvas || !frame) return;
  canvas.width = store.targetWidth;
  canvas.height = store.targetHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.putImageData(frame.result.previewImageData, 0, 0);
}

onMounted(renderPreview);
watch(() => [store.selectedIndex, store.selectedFrame?.result, store.targetWidth, store.targetHeight], () => nextTick(renderPreview), { deep: true });
</script>

<template>
  <PanelSection class="video-output" title="Generated Output (C Array - Hex)">
    <template #actions><button class="ghost-btn" @click="copyOutput">⧉ Copy</button><button class="ghost-btn" @click="downloadOutput">⇩ Download</button></template>
    <pre class="code-block">{{ store.generatedSource }}</pre>
    <footer class="video-output-stats"><span>Frames: {{ store.processedFrames.length }}</span><span>Resolution: {{ store.targetWidth }} x {{ store.targetHeight }}</span><span>Bytes per frame: {{ store.bytesPerFrame }}</span><span>Total bytes: {{ store.estimatedBytes }}</span><span>FPS: {{ store.outputFps }}</span></footer>
    <aside class="video-animation-preview">
      <header><h3>Dot Matrix Animation Preview</h3><span>{{ store.targetWidth }} x {{ store.targetHeight }}</span></header>
      <div class="black-player small landscape animation-canvas adaptive-material-window video-adaptive-window" :class="{ 'sample-preview': !store.selectedFrame }">
        <canvas v-if="store.selectedFrame" ref="preview"></canvas>
        <VideoPixelSample v-else variant="output" :frame="4" />
      </div>
      <div class="animation-controls"><button class="primary-btn">Ⅱ</button><button>■</button><input type="range" min="0" max="100" value="42" /><span>{{ store.selectedIndex + 1 }} / {{ store.processedFrames.length || 86 }}</span><button class="active">1x</button><button>2x</button><button>4x</button></div>
      <button class="ghost-primary export-gif">▧ Export as GIF</button>
    </aside>
  </PanelSection>
</template>
