<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useFontModuloStore } from '../stores/fontModuloStore';

const store = useFontModuloStore();
const canvas = ref<HTMLCanvasElement | null>(null);

function renderPreview() {
  const el = canvas.value;
  if (!el) return;
  el.width = store.targetWidth;
  el.height = store.targetHeight;
  const context = el.getContext('2d');
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

onMounted(() => {
  store.generate();
  renderPreview();
});
watch(() => [store.bitmap, store.targetWidth, store.targetHeight], () => nextTick(renderPreview), { deep: true });
</script>

<template>
  <PanelSection class="font-preview" step="2" title="Pixel Preview">
    <template #actions><span class="tag">Width: {{ store.targetWidth }} px</span><span class="tag">Height: {{ store.targetHeight }} px</span><span class="tag">Total: {{ store.totalBits }} bits</span></template>
    <div class="font-preview-layout">
      <div class="tool-column"><button>■ Pixel</button><button class="active">▦ Grid</button><button @click="store.invert = !store.invert; store.generate()">□ Invert</button></div>
      <div class="han-grid font-canvas-wrap adaptive-material-window"><canvas ref="canvas"></canvas></div>
    </div>
    <footer class="zoom-footer"><button>−</button><span>400%</span><button>＋</button><input type="range" value="60" /><button>⌕</button><button>⛶</button></footer>
  </PanelSection>
</template>
