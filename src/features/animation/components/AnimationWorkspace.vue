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
  <section class="media-workspace animation-workspace-panel">
    <div class="animation-source-row">
      <PanelSection class="animation-source-panel" title="Source Animation">
        <template #actions>
          <span class="tag green">GIF</span>
          <span class="tag blue">WebP</span>
          <span class="tag purple">APNG</span>
          <strong>{{ store.sourceWidth || store.targetWidth }} x {{ store.sourceHeight || store.targetHeight }} px</strong>
        </template>
        <div class="black-player animation-canvas animation-adaptive-window adaptive-material-window" :class="{ 'sample-preview': !store.selectedFrame }">
          <canvas v-if="store.selectedFrame" ref="mainCanvas"></canvas>
          <AnimationPixelSample v-else variant="source" :frame="1" />
        </div>
        <div class="media-controls animation-playback-controls">
          <button class="active">▶</button>
          <button>Ⅱ</button>
          <button>■</button>
          <span>Frame: <strong>{{ store.selectedIndex + 1 }} / {{ store.processedFrames.length || 48 }}</strong></span>
          <input v-model.number="store.selectedIndex" type="range" :max="Math.max(0, store.processedFrames.length - 1)" min="0" />
          <span>{{ store.selectedFrame?.delay ?? 200 }} ms</span>
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
          <span>Total frames: {{ store.processedFrames.length || 48 }}</span>
          <span>Duration: {{ ((store.totalDuration || 9600) / 1000).toFixed(2) }} s</span>
        </div>
      </PanelSection>
    </div>

    <PanelSection class="animation-strip-panel" title="Extracted Frames">
      <div class="frame-strip">
        <button>‹</button>
        <template v-if="store.processedFrames.length">
          <div v-for="(frame, index) in store.processedFrames" :key="`${frame.sourceIndex}-${index}`" class="frame-thumb" :class="{ active: index === store.selectedIndex }" @click="store.selectedIndex = index"><span></span><strong>{{ frame.sourceIndex }}</strong><small>{{ frame.delay }} ms</small></div>
        </template>
        <template v-else>
          <div v-for="frame in 8" :key="`empty-animation-frame-${frame}`" class="frame-thumb empty-thumb">
            <span><AnimationPixelSample variant="thumb" :frame="frame" compact /></span>
            <strong>{{ frame + 7 }}</strong>
            <small>200 ms</small>
          </div>
        </template>
        <button>›</button>
      </div>
    </PanelSection>

    <PanelSection class="animation-zoom-panel" title="Zoom">
      <div class="animation-zoom-layout">
        <div class="animation-zoom-tools">
          <label>Zoom<select><option>20x</option><option>16x</option><option>12x</option></select></label>
          <div class="zoom-button-grid"><button>＋</button><button>－</button><button>Fit</button><button>1:1</button></div>
        </div>
        <div class="zoom-matrix animation-canvas animation-adaptive-window adaptive-material-window" :class="{ 'sample-preview': !store.selectedFrame }">
          <canvas v-if="store.selectedFrame" ref="zoomCanvas"></canvas>
          <AnimationPixelSample v-else variant="matrix" :frame="2" />
        </div>
        <div class="animation-matrix-options">
          <label>Sync with filmstrip <input type="checkbox" checked /></label>
          <label>Grid <select><option>Dot (LED)</option><option>Square</option></select></label>
          <label>Pixel On <span class="swatch yellow"></span></label>
          <label>Background <span class="swatch checker"></span></label>
        </div>
      </div>
    </PanelSection>
  </section>
</template>
