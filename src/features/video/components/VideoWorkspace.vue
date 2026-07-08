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
    <video v-if="store.objectUrl" class="hero-video landscape" :src="store.objectUrl" controls muted />
    <div v-else class="video-sample-stage landscape">
      <VideoPixelSample variant="source" :frame="1" />
    </div>
    <PanelSection title="Current Frame (Source)">
      <div class="pixel-art video-source" :class="{ 'sample-preview': !store.objectUrl }">
        <video v-if="store.objectUrl" :src="store.objectUrl" muted />
        <VideoPixelSample v-else variant="source" :frame="2" compact />
      </div>
    </PanelSection>
    <PanelSection title="Extracted Frame (Dot Matrix Preview)">
      <div class="dot-preview landscape animation-canvas" :class="{ 'sample-preview': !store.selectedFrame }">
        <canvas v-if="store.selectedFrame" ref="matrixCanvas"></canvas>
        <VideoPixelSample v-else variant="matrix" :frame="3" />
      </div>
    </PanelSection>
    <PanelSection title="Sampled Frames (Every 3 frames at 10 fps)">
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
