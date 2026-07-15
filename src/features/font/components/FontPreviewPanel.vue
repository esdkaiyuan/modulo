<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useFontModuloStore } from '../stores/fontModuloStore';

const store = useFontModuloStore();
const canvas = ref<HTMLCanvasElement | null>(null);
const zoomPercent = ref(400);

const canvasStyle = computed(() => ({
  width: `${(store.targetWidth * zoomPercent.value) / 100}px`,
  height: `${(store.targetHeight * zoomPercent.value) / 100}px`,
  imageRendering: 'pixelated' as const
}));

function adjustZoom(delta: number) {
  zoomPercent.value = Math.min(1600, Math.max(100, zoomPercent.value + delta));
}

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
  if (!store.bitmap.length) store.generate();
  renderPreview();
});
watch(() => [store.bitmap, store.targetWidth, store.targetHeight], () => nextTick(renderPreview), { deep: true });
</script>

<template>
  <PanelSection class="font-preview" step="2" title="Pixel Preview">
    <template #actions><span class="tag">Width: {{ store.targetWidth }} px</span><span class="tag">Height: {{ store.targetHeight }} px</span><span class="tag">Total: {{ store.totalBits }} bits</span></template>
    <div class="font-preview-layout">
      <div class="tool-column"><button :class="{ active: store.invert }" @click="store.invert = !store.invert">□ Invert</button></div>
      <div class="han-grid font-canvas-wrap adaptive-material-window font-adaptive-window"><canvas ref="canvas" :style="canvasStyle"></canvas></div>
    </div>
    <div v-if="store.glyphs.length > 1" class="glyph-strip">
      <button
        v-for="(glyph, index) in store.glyphs"
        :key="`${glyph.char}-${index}`"
        class="glyph-chip"
        :class="{ active: index === store.selectedGlyphIndex }"
        @click="store.selectedGlyphIndex = index"
      >{{ glyph.char }}</button>
    </div>
    <footer class="zoom-footer">
      <button @click="adjustZoom(-100)" title="Zoom out">−</button>
      <span>{{ zoomPercent }}%</span>
      <button @click="adjustZoom(100)" title="Zoom in">＋</button>
      <input type="range" min="100" max="1600" step="50" v-model.number="zoomPercent" />
      <button @click="zoomPercent = 400" title="Reset zoom">⌕</button>
    </footer>
  </PanelSection>
</template>

<style scoped>
.glyph-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid var(--tool-border-soft, #e5e9f0);
}

.glyph-chip {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--tool-border, #d7dde7);
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s;
}

.glyph-chip:hover {
  border-color: var(--tool-primary, #2167e8);
  color: var(--tool-primary, #2167e8);
}

.glyph-chip.active {
  background: var(--tool-primary, #2167e8);
  border-color: var(--tool-primary, #2167e8);
  color: #fff;
}
</style>
