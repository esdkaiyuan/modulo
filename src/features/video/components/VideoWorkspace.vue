<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useVideoModuloStore } from '../stores/videoModuloStore';

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
    <div v-else class="hero-video landscape"></div>
    <PanelSection title="Current Frame (Source)"><div class="pixel-art video-source"><video v-if="store.objectUrl" :src="store.objectUrl" muted /></div></PanelSection>
    <PanelSection title="Extracted Frame (Dot Matrix Preview)"><div class="dot-preview landscape animation-canvas"><canvas ref="matrixCanvas"></canvas></div></PanelSection>
    <PanelSection title="Sampled Frames (Every 3 frames at 10 fps)">
      <div class="frame-strip compact"><button>‹</button><div v-for="(frame, index) in store.processedFrames.slice(0, 12)" :key="`${frame.time}-${index}`" class="video-thumb" :class="{ active: index === store.selectedIndex }" @click="store.selectedIndex = index"><span></span><small>{{ frame.time.toFixed(3) }}s<br />#{{ index + 1 }}</small></div><button>›</button></div>
    </PanelSection>
  </section>
</template>
