<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useAnimationModuloStore } from '../stores/animationModuloStore';
import AnimationPixelSample from './AnimationPixelSample.vue';

const store = useAnimationModuloStore();
const mainCanvas = ref<HTMLCanvasElement | null>(null);
const zoomCanvas = ref<HTMLCanvasElement | null>(null);
const isPlaying = ref(false);
let playTimer: ReturnType<typeof setTimeout> | null = null;

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
  paint(mainCanvas.value);
  paint(zoomCanvas.value);
}

function scheduleNextFrame() {
  if (!isPlaying.value || !store.processedFrames.length) return;
  const delay = Math.max(20, store.selectedFrame?.delay ?? 100);
  playTimer = setTimeout(() => {
    store.selectedIndex = (store.selectedIndex + 1) % store.processedFrames.length;
    scheduleNextFrame();
  }, delay);
}

function play() {
  if (isPlaying.value || !store.processedFrames.length) return;
  isPlaying.value = true;
  scheduleNextFrame();
}

function pause() {
  isPlaying.value = false;
  if (playTimer !== null) {
    clearTimeout(playTimer);
    playTimer = null;
  }
}

function stop() {
  pause();
  store.selectedIndex = 0;
}

function stepFrame(delta: number) {
  if (!store.processedFrames.length) return;
  const count = store.processedFrames.length;
  store.selectedIndex = (store.selectedIndex + delta + count) % count;
}

const zoomLevel = ref(8);
const zoomStyle = computed(() => ({
  width: `${store.targetWidth * zoomLevel.value}px`,
  height: `${store.targetHeight * zoomLevel.value}px`,
  imageRendering: 'pixelated' as const
}));

function adjustZoom(delta: number) {
  zoomLevel.value = Math.min(24, Math.max(1, zoomLevel.value + delta));
}

onMounted(render);
onBeforeUnmount(pause);
watch(() => [store.selectedIndex, store.processedFrames, store.targetWidth, store.targetHeight], () => nextTick(render), { deep: true });
</script>

<template>
  <section class="media-workspace animation-workspace-panel">
    <div class="animation-source-row">
      <PanelSection class="animation-source-panel" title="Source Animation">
        <template #actions>
          <span class="tag green">GIF</span>
          <strong>{{ store.sourceWidth || store.targetWidth }} x {{ store.sourceHeight || store.targetHeight }} px</strong>
        </template>
        <div class="black-player animation-canvas animation-adaptive-window adaptive-material-window" :class="{ 'sample-preview': !store.selectedFrame }">
          <canvas v-if="store.selectedFrame" ref="mainCanvas"></canvas>
          <AnimationPixelSample v-else variant="source" :frame="1" />
        </div>
        <div class="media-controls animation-playback-controls">
          <button :class="{ active: isPlaying }" :disabled="!store.processedFrames.length" @click="play" title="Play">▶</button>
          <button :disabled="!isPlaying" @click="pause" title="Pause">Ⅱ</button>
          <button :disabled="!store.processedFrames.length" @click="stop" title="Stop">■</button>
          <span>Frame: <strong>{{ store.processedFrames.length ? store.selectedIndex + 1 : 0 }} / {{ store.processedFrames.length }}</strong></span>
          <input v-model.number="store.selectedIndex" type="range" :max="Math.max(0, store.processedFrames.length - 1)" min="0" @input="pause" />
          <span>{{ store.selectedFrame?.delay ?? 0 }} ms</span>
        </div>
      </PanelSection>

      <PanelSection class="animation-sampling-card" title="Frame Range">
        <div class="setting-grid">
          <label>Start<input v-model.number="store.startFrame" type="number" min="1" /></label>
          <label>End<input v-model.number="store.endFrame" type="number" min="1" /></label>
        </div>
        <label class="field-label">Sampling Rate
          <select v-model.number="store.sampleStep">
            <option :value="1">1 frame per step</option>
            <option :value="2">2 frames per step</option>
            <option :value="3">3 frames per step</option>
            <option :value="5">5 frames per step</option>
            <option :value="10">10 frames per step</option>
          </select>
        </label>
        <div class="animation-info-box">
          <span>Total frames: {{ store.processedFrames.length }}</span>
          <span>Duration: {{ (store.totalDuration / 1000).toFixed(2) }} s</span>
        </div>
      </PanelSection>
    </div>

    <PanelSection class="animation-strip-panel" title="Extracted Frames">
      <div class="frame-strip">
        <button :disabled="!store.processedFrames.length" @click="stepFrame(-1)" title="Previous frame">‹</button>
        <template v-if="store.processedFrames.length">
          <div v-for="(frame, index) in store.processedFrames" :key="`${frame.sourceIndex}-${index}`" class="frame-thumb" :class="{ active: index === store.selectedIndex }" @click="store.selectedIndex = index"><span></span><strong>{{ frame.sourceIndex }}</strong><small>{{ frame.delay }} ms</small></div>
        </template>
        <template v-else>
          <div class="frame-strip-empty">Load a GIF to extract frames</div>
        </template>
        <button :disabled="!store.processedFrames.length" @click="stepFrame(1)" title="Next frame">›</button>
      </div>
    </PanelSection>

    <PanelSection class="animation-zoom-panel" title="Zoom">
      <div class="animation-zoom-layout">
        <div class="animation-zoom-tools">
          <label>Zoom
            <select v-model.number="zoomLevel">
              <option :value="20">20x</option>
              <option :value="16">16x</option>
              <option :value="12">12x</option>
              <option :value="8">8x</option>
              <option :value="4">4x</option>
            </select>
          </label>
          <div class="zoom-button-grid">
            <button @click="adjustZoom(1)" title="Zoom in">＋</button>
            <button @click="adjustZoom(-1)" title="Zoom out">－</button>
            <button @click="zoomLevel = 8" title="Fit">Fit</button>
            <button @click="zoomLevel = 1" title="Actual size">1:1</button>
          </div>
        </div>
        <div class="zoom-matrix animation-canvas animation-adaptive-window adaptive-material-window" :class="{ 'sample-preview': !store.selectedFrame }">
          <canvas v-if="store.selectedFrame" ref="zoomCanvas" :style="zoomStyle"></canvas>
          <AnimationPixelSample v-else variant="matrix" :frame="2" />
        </div>
      </div>
    </PanelSection>
  </section>
</template>

<style scoped>
.frame-strip-empty {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 64px;
  color: var(--tool-muted);
  font-size: 12px;
}
</style>
