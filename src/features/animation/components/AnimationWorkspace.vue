<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useAnimationModuloStore } from '../stores/animationModuloStore';
import AnimationPixelSample from './AnimationPixelSample.vue';

const store = useAnimationModuloStore();
const mainCanvas = ref<HTMLCanvasElement | null>(null);
const zoomCanvas = ref<HTMLCanvasElement | null>(null);

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

onMounted(render);
watch(() => [store.selectedIndex, store.processedFrames, store.targetWidth, store.targetHeight], () => nextTick(render), { deep: true });
</script>

<template>
  <section class="media-workspace">
    <PanelSection title="Source Animation">
      <template #actions><span class="tag green">GIF</span><span class="tag blue">Frames: {{ store.processedFrames.length }}</span><span class="tag purple">{{ store.sourceWidth }} x {{ store.sourceHeight }} px</span><strong>{{ store.targetWidth }} x {{ store.targetHeight }} px</strong></template>
      <div class="black-player animation-canvas adaptive-material-window" :class="{ 'sample-preview': !store.selectedFrame }">
        <canvas v-if="store.selectedFrame" ref="mainCanvas"></canvas>
        <AnimationPixelSample v-else variant="source" :frame="1" />
      </div>
      <div class="media-controls"><button>▶</button><button>Ⅱ</button><button>■</button><span>Frame: <strong>{{ store.selectedIndex + 1 }} / {{ store.processedFrames.length }}</strong></span><input v-model.number="store.selectedIndex" type="range" :max="Math.max(0, store.processedFrames.length - 1)" min="0" /><span>{{ store.selectedFrame?.delay ?? 0 }} ms</span></div>
    </PanelSection>
    <PanelSection title="Extracted Frames">
      <div class="frame-strip">
        <button>‹</button>
        <template v-if="store.processedFrames.length">
          <div v-for="(frame, index) in store.processedFrames" :key="`${frame.sourceIndex}-${index}`" class="frame-thumb" :class="{ active: index === store.selectedIndex }" @click="store.selectedIndex = index"><span></span><strong>{{ frame.sourceIndex }}</strong><small>{{ frame.delay }} ms</small></div>
        </template>
        <template v-else>
          <div v-for="frame in 4" :key="`empty-animation-frame-${frame}`" class="frame-thumb empty-thumb">
            <span><AnimationPixelSample variant="thumb" :frame="frame" compact /></span>
            <strong>{{ frame }}</strong>
            <small>{{ frame * 80 }} ms</small>
          </div>
        </template>
        <button>›</button>
      </div>
    </PanelSection>
    <PanelSection title="Zoom">
      <div class="zoom-matrix animation-canvas adaptive-material-window" :class="{ 'sample-preview': !store.selectedFrame }">
        <canvas v-if="store.selectedFrame" ref="zoomCanvas"></canvas>
        <AnimationPixelSample v-else variant="matrix" :frame="2" />
      </div>
    </PanelSection>
  </section>
</template>
