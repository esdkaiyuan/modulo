<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useVideoModuloStore } from '../stores/videoModuloStore';
import VideoPixelSample from './VideoPixelSample.vue';

const store = useVideoModuloStore();
const matrixCanvas = ref<HTMLCanvasElement | null>(null);
const outputCanvas = ref<HTMLCanvasElement | null>(null);

function paint(canvas: HTMLCanvasElement | null, bitmap = store.selectedFrame?.bitmap) {
  if (!canvas || !bitmap) return;
  canvas.width = store.targetWidth;
  canvas.height = store.targetHeight;
  const context = canvas.getContext('2d');
  if (!context) return;
  const image = context.createImageData(store.targetWidth, store.targetHeight);
  for (let index = 0; index < bitmap.length; index += 1) {
    const offset = index * 4;
    const value = bitmap[index] ? 0 : 255;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function render() {
  paint(matrixCanvas.value);
  paint(outputCanvas.value);
}

onMounted(render);
watch(() => [store.selectedIndex, store.processedFrames, store.targetWidth, store.targetHeight], () => nextTick(render), { deep: true });
</script>

<template>
  <section class="video-workspace">
    <div class="video-hero-panel">
      <video v-if="store.objectUrl" class="hero-video landscape adaptive-material-window video-adaptive-window" :src="store.objectUrl" controls muted />
      <div v-else class="video-sample-stage landscape adaptive-material-window video-adaptive-window">
        <VideoPixelSample variant="source" :frame="1" />
      </div>
    </div>
    <PanelSection class="video-clip-controls" title="Current: 00:12:34 / Total: 00:45:22">
      <input class="video-timeline" type="range" min="0" max="100" value="42" />
      <div class="video-time-grid">
        <label class="field-label">Start Time<input v-model.number="store.startTime" type="number" min="0" step="0.1" /></label>
        <label class="field-label">End Time<input v-model.number="store.endTime" type="number" min="0" step="0.1" /></label>
        <label class="field-label">Sample Rate (FPS)<select v-model.number="store.sampleFps"><option :value="10">10 fps</option><option :value="15">15 fps</option><option :value="30">30 fps</option></select></label>
        <label class="field-label">Sample Every N frames<input v-model.number="store.sampleEveryNFrames" type="number" min="1" max="120" /></label>
      </div>
      <button class="primary-btn wide" @click="store.processFrames">⚙ Decode & Extract</button>
      <div class="decode-progress"><span></span><strong>Decoding: {{ store.processedFrames.length ? 100 : 67 }}%</strong><i></i><small>ETA: 00:00:18</small></div>
    </PanelSection>
    <PanelSection title="Current Frame (Source)">
      <template #actions><span class="tag">{{ store.sourceWidth || 1920 }} x {{ store.sourceHeight || 1080 }}</span></template>
      <div class="pixel-art video-source adaptive-material-window video-adaptive-window" :class="{ 'sample-preview': !store.objectUrl }">
        <video v-if="store.objectUrl" :src="store.objectUrl" muted />
        <VideoPixelSample v-else variant="source" :frame="2" compact />
      </div>
      <footer class="video-frame-meta"><span>Time: 00:12:34.000</span><span>Frame: {{ store.selectedIndex + 376 }}</span><span>Resolution: {{ store.sourceWidth || 1920 }} x {{ store.sourceHeight || 1080 }}</span></footer>
    </PanelSection>
    <PanelSection title="Extracted Frame (Dot Matrix Preview)">
      <template #actions><span class="tag">{{ store.targetWidth }} x {{ store.targetHeight }}</span></template>
      <div class="dot-preview landscape animation-canvas adaptive-material-window video-adaptive-window" :class="{ 'sample-preview': !store.selectedFrame }">
        <canvas v-if="store.selectedFrame" ref="matrixCanvas"></canvas>
        <VideoPixelSample v-else variant="matrix" :frame="3" />
      </div>
      <footer class="zoom-footer video-matrix-tools"><span>400%</span><button>⌕</button><button>⊕</button><button>⊖</button><button class="active">▦</button><button>☼</button></footer>
    </PanelSection>
    <PanelSection title="Sampled Frames (Every 3 frames at 10 fps)">
      <template #actions><span>{{ store.processedFrames.length || 86 }} frames</span></template>
      <div class="frame-strip compact">
        <button>‹</button>
        <template v-if="store.processedFrames.length">
          <div v-for="(frame, index) in store.processedFrames.slice(0, 12)" :key="`${frame.time}-${index}`" class="video-thumb" :class="{ active: index === store.selectedIndex }" @click="store.selectedIndex = index"><span></span><small>{{ frame.time.toFixed(3) }}s<br />#{{ index + 1 }}</small></div>
        </template>
        <template v-else>
          <div v-for="frame in 4" :key="`empty-video-frame-${frame}`" class="video-thumb empty-thumb">
            <span><VideoPixelSample variant="thumb" :frame="frame" compact /></span>
            <small>0.{{ frame * 3 }}00s<br />#{{ frame }}</small>
          </div>
        </template>
        <button>›</button>
      </div>
    </PanelSection>
  </section>
</template>
