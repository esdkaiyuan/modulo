<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useImageModuloStore } from '../stores/imageModuloStore';

const store = useImageModuloStore();
const containerRef = ref<HTMLDivElement | null>(null);
const cropInnerRef = ref<HTMLDivElement | null>(null);

// Non-reactive drag state — never triggers Vue re-render
let isDragging = false;
let isResizing = false;
let resizeHandle = '';

const dragStart = { x: 0, y: 0, cropX: 0, cropY: 0 };
const resizeStart = { x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 };

const containerSize = { w: 0, h: 0 };

function updateContainerSize() {
  if (!containerRef.value) return;
  containerSize.w = containerRef.value.offsetWidth;
  containerSize.h = containerRef.value.offsetHeight;
}

function setCropVisual(cx: number, cy: number, cw: number, ch: number) {
  const el = cropInnerRef.value;
  if (!el || !containerSize.w || !store.sourceWidth) return;
  el.style.left = `${(cx / store.sourceWidth) * containerSize.w}px`;
  el.style.top = `${(cy / store.sourceHeight) * containerSize.h}px`;
  el.style.width = `${(cw / store.sourceWidth) * containerSize.w}px`;
  el.style.height = `${(ch / store.sourceHeight) * containerSize.h}px`;
}

function readCropVisual() {
  const el = cropInnerRef.value;
  if (!el || !containerSize.w || !store.sourceWidth) return null;
  const l = parseFloat(el.style.left) || 0;
  const t = parseFloat(el.style.top) || 0;
  const w = parseFloat(el.style.width) || 0;
  const h = parseFloat(el.style.height) || 0;
  return {
    x: Math.round((l / containerSize.w) * store.sourceWidth),
    y: Math.round((t / containerSize.h) * store.sourceHeight),
    w: Math.round((w / containerSize.w) * store.sourceWidth),
    h: Math.round((h / containerSize.h) * store.sourceHeight),
  };
}

function applyStoreToVisual() {
  if (!store.cropW || !store.cropH) return;
  setCropVisual(store.cropX, store.cropY, store.cropW, store.cropH);
}

function onMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement;
  updateContainerSize();

  if (target.classList.contains('crop-resize-handle')) {
    isResizing = true;
    resizeHandle = target.dataset.handle || '';
    resizeStart.x = event.clientX;
    resizeStart.y = event.clientY;
    resizeStart.cropX = store.cropX;
    resizeStart.cropY = store.cropY;
    resizeStart.cropW = store.cropW;
    resizeStart.cropH = store.cropH;
  } else if (target.classList.contains('crop-overlay') || target.classList.contains('crop-inner')) {
    isDragging = true;
    dragStart.x = event.clientX;
    dragStart.y = event.clientY;
    dragStart.cropX = store.cropX;
    dragStart.cropY = store.cropY;
  }
  event.preventDefault();
  event.stopPropagation();
}

function onMouseMove(event: MouseEvent) {
  if (!isDragging && !isResizing) return;
  if (!containerSize.w || !containerSize.h) return;

  const scaleX = store.sourceWidth / containerSize.w;
  const scaleY = store.sourceHeight / containerSize.h;

  if (isDragging) {
    const dx = Math.round((event.clientX - dragStart.x) * scaleX);
    const dy = Math.round((event.clientY - dragStart.y) * scaleY);
    const cx = Math.max(0, Math.min(dragStart.cropX + dx, store.sourceWidth - store.cropW));
    const cy = Math.max(0, Math.min(dragStart.cropY + dy, store.sourceHeight - store.cropH));
    setCropVisual(cx, cy, store.cropW, store.cropH);
  }

  if (isResizing) {
    const dx = Math.round((event.clientX - resizeStart.x) * scaleX);
    const dy = Math.round((event.clientY - resizeStart.y) * scaleY);

    let newW = resizeStart.cropW;
    let newH = resizeStart.cropH;
    let newX = resizeStart.cropX;
    let newY = resizeStart.cropY;

    if (resizeHandle.includes('e')) {
      newW = Math.max(1, Math.min(store.sourceWidth - newX, resizeStart.cropW + dx));
    }
    if (resizeHandle.includes('s')) {
      newH = Math.max(1, Math.min(store.sourceHeight - newY, resizeStart.cropH + dy));
    }
    if (resizeHandle.includes('w')) {
      const maxDx = resizeStart.cropW - 1;
      const actualDx = Math.max(-resizeStart.cropX, Math.min(maxDx, dx));
      newW = resizeStart.cropW - actualDx;
      newX = resizeStart.cropX + actualDx;
    }
    if (resizeHandle.includes('n')) {
      const maxDy = resizeStart.cropH - 1;
      const actualDy = Math.max(-resizeStart.cropY, Math.min(maxDy, dy));
      newH = resizeStart.cropH - actualDy;
      newY = resizeStart.cropY + actualDy;
    }

    setCropVisual(newX, newY, newW, newH);
  }
}

function onMouseUp() {
  if ((isDragging || isResizing) && cropInnerRef.value) {
    const visual = readCropVisual();
    if (visual) {
      store.cropX = visual.x;
      store.cropY = visual.y;
      store.cropW = visual.w;
      store.cropH = visual.h;
      // Crop size now independent of output resolution
      requestAnimationFrame(() => {
        store.process();
      });
    }
  }
  isDragging = false;
  isResizing = false;
  resizeHandle = '';
}

let resizeObserver: ResizeObserver | null = null;

function onContainerResize() {
  updateContainerSize();
  if (store.cropW && store.cropH && !isDragging && !isResizing) {
    applyStoreToVisual();
  }
}

function onWindowResize() {
  updateContainerSize();
  applyStoreToVisual();
}

onMounted(() => {
  nextTick(() => {
    if (containerRef.value) {
      updateContainerSize();
      if (containerSize.w > 0 && containerSize.h > 0 && store.cropW && store.cropH) {
        setCropVisual(store.cropX, store.cropY, store.cropW, store.cropH);
      }
      resizeObserver = new ResizeObserver(onContainerResize);
      resizeObserver.observe(containerRef.value);
      window.addEventListener('resize', onWindowResize);
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<template>
  <div
    ref="containerRef"
    class="crop-overlay"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
  >
    <slot />

    <div
      v-if="store.cropW > 0 && store.cropH > 0"
      ref="cropInnerRef"
      class="crop-inner"
    >
      <div class="crop-border">
        <div class="crop-resize-handle" data-handle="nw"></div>
        <div class="crop-resize-handle" data-handle="n"></div>
        <div class="crop-resize-handle" data-handle="ne"></div>
        <div class="crop-resize-handle" data-handle="w"></div>
        <div class="crop-resize-handle" data-handle="e"></div>
        <div class="crop-resize-handle" data-handle="sw"></div>
        <div class="crop-resize-handle" data-handle="s"></div>
        <div class="crop-resize-handle" data-handle="se"></div>
      </div>
    </div>
  </div>
</template>
