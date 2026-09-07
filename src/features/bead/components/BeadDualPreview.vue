<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useBeadPatternStore } from '../stores/beadPatternStore';
import { renderPattern } from '../patternRenderer';
import { t } from '../../../i18n';

const store = useBeadPatternStore();

// ── Original image preview ──
const origZoom = ref(1);
const origCanvas = ref<HTMLCanvasElement | null>(null);
const origFsCanvas = ref<HTMLCanvasElement | null>(null);
const origFullscreen = ref(false);

function renderTo(el: HTMLCanvasElement | null, fn: () => void) {
  if (el) fn();
}

function renderOrig(target: HTMLCanvasElement) {
  if (!store.sourceDataUrl) return;
  const img = new Image();
  img.onload = () => {
    const panel = target.parentElement;
    const maxW = panel ? panel.clientWidth - 16 : 600;
    const fitScale = Math.min(maxW / img.naturalWidth, 1);
    const scale = fitScale * origZoom.value;
    target.width = img.naturalWidth * scale;
    target.height = img.naturalHeight * scale;
    const ctx = target.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = scale < 2;
      ctx.drawImage(img, 0, 0, target.width, target.height);
    }
  };
  img.src = store.sourceDataUrl;
}

// ── Bead pattern preview ──
const patZoom = ref(16);
const patCanvas = ref<HTMLCanvasElement | null>(null);
const patFsCanvas = ref<HTMLCanvasElement | null>(null);
const patFullscreen = ref(false);

function renderPat(target: HTMLCanvasElement) {
  if (!store.pattern) return;
  const panel = target.parentElement;
  const maxW = panel ? panel.clientWidth - 16 : 600;
  const fitCell = Math.min(patZoom.value, maxW / store.pattern.width);
  const rendered = renderPattern(store.pattern, {
    cellSize: fitCell,
    showGrid: fitCell >= 6,
    showCoordinates: fitCell >= 10,
    showBoardLines: true,
    showLegend: false,
    title: ''
  });
  target.width = rendered.width;
  target.height = rendered.height;
  const ctx = target.getContext('2d');
  if (ctx) ctx.drawImage(rendered, 0, 0);
}

// ── Render triggers ──
watch(() => [store.sourceDataUrl, origZoom.value], () => {
  nextTick(() => {
    if (origCanvas.value) renderOrig(origCanvas.value);
    if (origFullscreen.value && origFsCanvas.value) renderOrig(origFsCanvas.value);
  });
});

watch(() => [store.pattern, patZoom.value], () => {
  nextTick(() => {
    if (patCanvas.value) renderPat(patCanvas.value);
    if (patFullscreen.value && patFsCanvas.value) renderPat(patFsCanvas.value);
  });
}, { deep: true });

// Re-render fullscreen when opened
watch(origFullscreen, (v) => { if (v) nextTick(() => { if (origFsCanvas.value) renderOrig(origFsCanvas.value); }); });
watch(patFullscreen, (v) => { if (v) nextTick(() => { if (patFsCanvas.value) renderPat(patFsCanvas.value); }); });

// ── Wheel zoom on panels ──
function onOrigWheel(e: WheelEvent) {
  e.preventDefault();
  origZoom.value = Math.max(0.25, Math.min(4, origZoom.value + (e.deltaY > 0 ? -0.1 : 0.1)));
}

function onPatWheel(e: WheelEvent) {
  e.preventDefault();
  patZoom.value = Math.max(4, Math.min(40, patZoom.value + (e.deltaY > 0 ? -1 : 1)));
}

onMounted(() => {
  if (origCanvas.value) renderOrig(origCanvas.value);
  if (patCanvas.value) renderPat(patCanvas.value);
});
</script>

<template>
  <div class="bead-center-workspace">
    <!-- Original Image Panel -->
    <div class="bead-center-panel">
      <div class="bead-center-head">
        <span class="bead-center-label">{{ t('bead.originalImage') }}</span>
        <div class="bead-center-controls">
          <button class="btn sm" @click="origZoom = Math.max(0.25, origZoom - 0.25)">−</button>
          <span class="bead-zoom-val">{{ Math.round(origZoom * 100) }}%</span>
          <button class="btn sm" @click="origZoom = Math.min(4, origZoom + 0.25)">+</button>
          <button class="btn sm" @click="origFullscreen = true">⛶</button>
        </div>
      </div>
      <div class="bead-center-body" @wheel.prevent="onOrigWheel">
        <div v-if="!store.sourceDataUrl" class="bead-center-empty">
          <span>📷</span>
          <span>{{ t('bead.uploadHint') }}</span>
        </div>
        <canvas v-else ref="origCanvas" class="bead-center-canvas" />
      </div>
    </div>

    <!-- Bead Pattern Panel -->
    <div class="bead-center-panel">
      <div class="bead-center-head">
        <span class="bead-center-label">{{ t('bead.beadPattern') }} ({{ store.gridWidth }}×{{ store.gridHeight }})</span>
        <div class="bead-center-controls">
          <button class="btn sm" @click="patZoom = Math.max(4, patZoom - 2)">−</button>
          <span class="bead-zoom-val">{{ patZoom }}px</span>
          <button class="btn sm" @click="patZoom = Math.min(40, patZoom + 2)">+</button>
          <button class="btn sm" @click="patFullscreen = true">⛶</button>
        </div>
      </div>
      <div class="bead-center-body" @wheel.prevent="onPatWheel">
        <div v-if="!store.pattern" class="bead-center-empty">
          <span>🎨</span>
          <span>{{ t('bead.emptyPreview') }}</span>
        </div>
        <canvas v-else ref="patCanvas" class="bead-center-canvas bead-pattern-canvas" />
      </div>
    </div>

    <!-- Fullscreen overlays -->
    <Teleport to="body">
      <div v-if="origFullscreen" class="bead-fs-overlay" @click="origFullscreen = false">
        <div class="bead-fs-bar" @click.stop>
          <span>{{ t('bead.originalImage') }}</span>
          <div class="bead-center-controls">
            <button class="btn sm" @click.stop="origZoom = Math.max(0.25, origZoom - 0.25)">−</button>
            <span class="bead-zoom-val">{{ Math.round(origZoom * 100) }}%</span>
            <button class="btn sm" @click.stop="origZoom = Math.min(4, origZoom + 0.25)">+</button>
            <button class="btn sm" @click.stop="origFullscreen = false">✕</button>
          </div>
        </div>
        <div class="bead-fs-body" @click.stop @wheel.prevent="onOrigWheel">
          <canvas ref="origFsCanvas" class="bead-fs-canvas" />
        </div>
      </div>

      <div v-if="patFullscreen" class="bead-fs-overlay" @click="patFullscreen = false">
        <div class="bead-fs-bar" @click.stop>
          <span>{{ t('bead.beadPattern') }} — {{ store.gridWidth }}×{{ store.gridHeight }}</span>
          <div class="bead-center-controls">
            <button class="btn sm" @click.stop="patZoom = Math.max(4, patZoom - 2)">−</button>
            <span class="bead-zoom-val">{{ patZoom }}px</span>
            <button class="btn sm" @click.stop="patZoom = Math.min(40, patZoom + 2)">+</button>
            <button class="btn sm" @click.stop="patFullscreen = false">✕</button>
          </div>
        </div>
        <div class="bead-fs-body" @click.stop @wheel.prevent="onPatWheel">
          <canvas ref="patFsCanvas" class="bead-fs-canvas bead-pattern-canvas" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
