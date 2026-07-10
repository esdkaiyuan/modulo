<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { usePixelStore } from '../../../stores/pixelStore';

const store = usePixelStore();
const canvas = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);

const cellSize = computed(() => Math.max(12, Math.round(store.zoom / 35)));
const canvasSize = computed(() => store.width * cellSize.value);

function render() {
  const el = canvas.value;
  if (!el) return;

  el.width = canvasSize.value;
  el.height = canvasSize.value;

  const ctx = el.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, el.width, el.height);

  store.pixels.forEach((color, index) => {
    const x = index % store.width;
    const y = Math.floor(index / store.width);
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize.value, y * cellSize.value, cellSize.value, cellSize.value);
  });

  if (store.showGrid) {
    ctx.strokeStyle = 'rgba(170, 178, 186, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= store.width; i += 1) {
      const pos = i * cellSize.value + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, el.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(el.width, pos);
      ctx.stroke();
    }
  }
}

function pointerToPixel(event: PointerEvent) {
  const el = canvas.value;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / cellSize.value);
  const y = Math.floor((event.clientY - rect.top) / cellSize.value);
  if (x < 0 || y < 0 || x >= store.width || y >= store.height) return null;
  return { x, y };
}

function drawAt(event: PointerEvent) {
  const pixel = pointerToPixel(event);
  if (!pixel) return;
  store.setCursor(pixel.x, pixel.y);
  store.paintPixel(pixel.x, pixel.y);
}

function handlePointerDown(event: PointerEvent) {
  isDrawing.value = true;
  canvas.value?.setPointerCapture(event.pointerId);
  drawAt(event);
}

function handlePointerMove(event: PointerEvent) {
  const pixel = pointerToPixel(event);
  if (pixel) store.setCursor(pixel.x, pixel.y);
  if (isDrawing.value && store.activeTool !== 'fill' && store.activeTool !== 'eyedropper') {
    drawAt(event);
  }
}

function handlePointerUp(event: PointerEvent) {
  isDrawing.value = false;
  canvas.value?.releasePointerCapture(event.pointerId);
}

onMounted(render);
watch(
  () => [store.pixels, store.showGrid, store.zoom, store.width, store.height],
  () => nextTick(render),
  { deep: true }
);
</script>

<template>
  <div class="canvas-wrap handdraw-adaptive-window adaptive-material-window">
    <canvas
      ref="canvas"
      class="pixel-canvas"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerUp"
      @contextmenu.prevent
    />
  </div>
</template>
