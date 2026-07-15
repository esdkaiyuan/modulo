<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useVideoModuloStore } from '../stores/videoModuloStore';

const store = useVideoModuloStore();
const matrixCanvas = ref<HTMLCanvasElement | null>(null);
const sourceVideo = ref<HTMLVideoElement | null>(null);
const timelineRef = ref<HTMLInputElement | null>(null);
let rafPending = false;

// ── Helpers ────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(m).padStart(2, '00')}:${String(s).padStart(2, '00')}:${String(ms).padStart(3, '000')}`;
}

function scheduleRender() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    renderMatrix();
    renderThumbnails();
  });
}

function paintMono(canvas: HTMLCanvasElement | null, bitmap?: Uint8Array, bw?: number, bh?: number) {
  if (!canvas) return;
  const cw = bw ?? store.targetWidth;
  const ch = bh ?? store.targetHeight;
  if (cw <= 0 || ch <= 0) return;
  const bmp = bitmap ?? store.selectedFrame?.bitmap;
  if (!bmp || !bmp.length) return;

  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.createImageData(cw, ch);
  const data = image.data;
  for (let i = 0; i < bmp.length; i++) {
    const off = i * 4;
    const v = bmp[i] ? 0 : 255;
    data[off] = v;
    data[off + 1] = v;
    data[off + 2] = v;
    data[off + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

function renderMatrix() {
  paintMono(matrixCanvas.value);
}

function renderThumbnails() {
  nextTick(() => {
    try {
      document.querySelectorAll('.video-thumb canvas.thumb-canvas').forEach((el) => {
        const canvas = el as HTMLCanvasElement | null;
        if (!canvas || !canvas.isConnected) return;
        const frameIndex = Number(canvas.getAttribute('data-frame-index'));
        if (isNaN(frameIndex)) return;
        const frame = store.processedFrames[frameIndex];
        if (!frame || !frame.bitmap.length) return;
        // Paint the full frame bitmap; CSS scales it down to thumb size.
        paintMono(canvas, frame.bitmap, store.targetWidth, store.targetHeight);
      });
    } catch { /* ignore HMR transient errors */ }
  });
}

// ── Computed ───────────────────────────────────────────

const displayScale = computed(() => store.previewScale);
const hasFrames = computed(() => store.processedFrames.length > 0);
const totalDuration = computed(() => Math.max(store.duration, 0.01));

const currentFrameTime = computed(() => {
  return store.processedFrames[store.selectedIndex]?.time ?? 0;
});

const timelinePercent = computed(() => {
  return totalDuration.value > 0 ? (currentFrameTime.value / totalDuration.value) * 100 : 0;
});

// ── Video ↔ Dot-Matrix Sync ───────────────────────────

/**
 * Find the processed frame closest to the given video time
 * and select it. This is the bridge between video playback and dot-matrix preview.
 */
function selectFrameAtTime(videoTime: number) {
  if (!store.processedFrames.length) return;
  const idx = store.processedFrames.findIndex((f, i) => {
    const next = store.processedFrames[i + 1];
    return videoTime >= f.time && (!next || videoTime < next.time);
  });
  if (idx >= 0 && idx !== store.selectedIndex) {
    store.selectedIndex = idx;
  }
}

/**
 * Called when the video's timeupdate event fires.
 * Syncs the dot-matrix preview to the current video time.
 */
function onVideoTimeUpdate() {
  if (!sourceVideo.value || !store.processedFrames.length) return;
  // Only sync when user is NOT dragging the timeline
  if (timelineRef.value && timelineRef.value.matches(':active')) return;
  selectFrameAtTime(sourceVideo.value.currentTime);
}

/**
 * Seek video to the time of the currently selected frame.
 */
function syncVideoToSelectedFrame() {
  const frame = store.processedFrames[store.selectedIndex];
  if (!frame || !sourceVideo.value) return;
  const video = sourceVideo.value;
  if (Math.abs(video.currentTime - frame.time) > 0.05) {
    video.currentTime = frame.time;
  }
}

/**
 * Play/Pause the source video together with the dot-matrix playback.
 */
function togglePlayback() {
  if (!sourceVideo.value || !store.objectUrl) return;
  if (sourceVideo.value.paused) {
    sourceVideo.value.play().catch(() => {});
    store.isPlaying = true;
  } else {
    sourceVideo.value.pause();
    store.isPlaying = false;
  }
}

// ── Frame Gallery ──────────────────────────────────────

function onFrameClick(index: number) {
  store.selectedIndex = index;
  syncVideoToSelectedFrame();
}

function prevFrame() {
  if (store.selectedIndex > 0) {
    store.selectedIndex--;
    syncVideoToSelectedFrame();
  }
}

function nextFrame() {
  if (store.selectedIndex < store.processedFrames.length - 1) {
    store.selectedIndex++;
    syncVideoToSelectedFrame();
  }
}

// ── Timeline ───────────────────────────────────────────

function onTimelineInput() {
  if (!timelineRef.value || !store.processedFrames.length) return;
  const pct = Number(timelineRef.value.value);
  const targetTime = (pct / 100) * store.duration;
  selectFrameAtTime(targetTime);
  syncVideoToSelectedFrame();
}

/**
 * Sync timeline slider position during video playback.
 */
watch(() => store.selectedIndex, () => {
  if (!timelineRef.value || !sourceVideo.value?.paused) return;
  const pct = totalDuration.value > 0 ? (currentFrameTime.value / totalDuration.value) * 100 : 0;
  timelineRef.value.value = String(pct);
});

// ── Watchers ───────────────────────────────────────────

watch(
  () => [store.selectedIndex, store.processedFrames.length, store.targetWidth, store.targetHeight],
  () => scheduleRender()
);

watch(() => displayScale.value, () => {
  const canvas = matrixCanvas.value;
  if (!canvas) return;
  const scale = displayScale.value || 1;
  canvas.style.width = (store.targetWidth * scale) + 'px';
  canvas.style.height = (store.targetHeight * scale) + 'px';
});

// Note: reprocessing on setting change is handled by the store's own debounced watch.

// ── Lifecycle ──────────────────────────────────────────

onMounted(() => {
  renderMatrix();
});

onBeforeUnmount(() => {
  store.pause();
});
</script>

<template>
  <section class="video-workspace">
    <!-- Dual Player: Source Video + Dot Matrix Output -->
    <div class="dual-player">
      <PanelSection title="Source Video" class="player-panel source-panel">
        <div class="video-player-wrap">
          <video
            v-if="store.objectUrl"
            ref="sourceVideo"
            class="source-video"
            :src="store.objectUrl"
            controls
            playsinline
            @timeupdate="onVideoTimeUpdate"
            @play="store.isPlaying = true"
            @pause="store.isPlaying = false"
            @ended="store.isPlaying = false"
          />
          <div v-else class="player-empty">
            <span class="empty-icon">&#x25B6;</span>
            <span>Open a video file to begin</span>
            <span class="empty-hint">Use the Open File button above</span>
          </div>
        </div>
        <footer class="player-meta">
          <span class="meta-file">{{ store.fileName || 'No file loaded' }}</span>
          <span class="meta-dim">{{ store.sourceWidth || '--' }} &times; {{ store.sourceHeight || '--' }}</span>
          <span class="meta-dur">{{ formatTime(store.duration) }}</span>
        </footer>
      </PanelSection>

      <PanelSection title="Dot Matrix Preview" class="player-panel output-panel">
        <div class="video-player-wrap dot-matrix-bg">
          <canvas
            v-if="hasFrames"
            ref="matrixCanvas"
            class="matrix-canvas"
          />
          <div v-else class="player-empty">
            <span class="empty-icon">&#x29D7;</span>
            <span>Load a video to generate dot matrix</span>
          </div>
        </div>
        <footer class="player-meta">
          <span>{{ store.targetWidth }} &times; {{ store.targetHeight }}</span>
          <span class="scale-badge">{{ displayScale }}x</span>
          <div class="zoom-btns">
            <button @click="store.previewScale = Math.max(1, store.previewScale - 1)" title="Zoom Out">&#x2210;</button>
            <button @click="store.previewScale = Math.min(8, store.previewScale + 1)" title="Zoom In">&#x2B1F;</button>
          </div>
          <button
            :class="{ active: store.polarity === 'negative' }"
            @click="store.polarity = store.polarity === 'positive' ? 'negative' : 'positive'"
            title="Invert"
          >&#x29D7;</button>
          <button
            class="play-btn"
            :class="{ active: store.isPlaying }"
            @click="togglePlayback"
            :title="store.isPlaying ? 'Pause' : 'Play'"
          >
            <span class="play-icon">{{ store.isPlaying ? '&#x23F8;' : '&#x25B6;' }}</span>
          </button>
        </footer>
      </PanelSection>
    </div>

    <!-- Timeline (visible only when frames are processed) -->
    <PanelSection v-if="hasFrames" title="Timeline" class="timeline-panel">
      <div class="timeline-row">
        <span class="time-label">{{ formatTime(currentFrameTime) }}</span>
        <input
          ref="timelineRef"
          type="range"
          class="timeline-slider"
          min="0"
          max="100"
          step="0.1"
          :value="timelinePercent"
          @input="onTimelineInput"
        />
        <span class="time-label">{{ formatTime(store.duration) }}</span>
        <span class="frame-indicator">
          Frame {{ store.selectedIndex + 1 }} / {{ store.processedFrames.length }}
        </span>
      </div>
    </PanelSection>

    <!-- Frame Gallery -->
    <PanelSection title="Frame Gallery" class="gallery-panel">
      <template #actions>
        <span class="frames-count">{{ store.processedFrames.length }} frames</span>
      </template>
      <div class="frame-strip">
        <button :disabled="store.selectedIndex <= 0" @click="prevFrame" title="Previous">&#x2039;</button>
        <template v-if="store.processedFrames.length">
          <div
            v-for="(frame, index) in store.processedFrames.slice(0, 24)"
            :key="`${frame.time}-${index}`"
            class="video-thumb"
            :class="{ active: index === store.selectedIndex }"
            @click="onFrameClick(index)"
          >
            <canvas class="thumb-canvas" :data-frame-index="index" />
            <small>{{ frame.time.toFixed(2) }}s<br />#{{ index + 1 }}</small>
          </div>
          <div v-if="store.processedFrames.length > 24" class="gallery-more">
            +{{ store.processedFrames.length - 24 }} more<br />use timeline
          </div>
        </template>
        <template v-else>
          <div v-for="n in 6" :key="`empty-${n}`" class="video-thumb empty-thumb">
            <span></span>
            <small>--</small>
          </div>
        </template>
        <button :disabled="store.selectedIndex >= store.processedFrames.length - 1" @click="nextFrame" title="Next">&#x203A;</button>
      </div>
    </PanelSection>
  </section>
</template>

<style scoped>
.video-workspace {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

/* ── Dual Player ─────────────────────────────────────── */

.dual-player {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-height: 0;
}

.player-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.source-panel :deep(.dm-card-body) {
  flex: 1;
  min-height: 0;
}

.output-panel :deep(.dm-card-body) {
  flex: 1;
  min-height: 0;
}

.video-player-wrap {
  width: 100%;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  overflow: hidden;
  background: #000;
}

.dot-matrix-bg {
  background:
    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
    #080808;
  background-size: 12px 12px;
}

.source-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.matrix-canvas {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}

.player-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: #8895a7;
  font-size: 13px;
  text-align: center;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.3;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 11px;
  color: #6b7a90;
}

/* ── Player Meta Bar ─────────────────────────────────── */

.player-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--tool-muted);
  border-top: 1px solid var(--tool-border);
  flex-wrap: wrap;
}

.meta-file {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
  font-weight: 600;
  color: var(--tool-text);
}

.scale-badge {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.player-meta button {
  min-height: 26px;
  padding: 0 8px;
  border: 1px solid var(--tool-border);
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.player-meta button:hover {
  border-color: var(--tool-primary);
  color: var(--tool-primary);
}

.player-meta button.active {
  background: var(--tool-primary);
  color: #fff;
  border-color: var(--tool-primary);
}

.play-btn {
  width: 30px;
  height: 26px;
  padding: 0;
}

.play-icon {
  font-size: 10px;
  line-height: 1;
}

.zoom-btns {
  display: flex;
  gap: 2px;
}

.zoom-btns button {
  min-width: 26px;
}

/* ── Timeline ────────────────────────────────────────── */

.timeline-panel :deep(.dm-card-body) {
  padding: 10px 16px;
}

.timeline-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.time-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--tool-muted);
  min-width: 66px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.frame-indicator {
  font-size: 11px;
  font-weight: 600;
  color: var(--tool-muted);
  padding: 2px 8px;
  border: 1px solid var(--tool-border-soft);
  border-radius: 4px;
  background: var(--tool-bg);
  white-space: nowrap;
}

.timeline-slider {
  flex: 1;
  height: 8px;
  accent-color: var(--tool-primary);
  cursor: pointer;
}

/* ── Frame Gallery ───────────────────────────────────── */

.gallery-panel :deep(.dm-card-body) {
  padding: 0;
}

.frames-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--tool-muted);
}

.frame-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  overflow-x: auto;
}

.frame-strip > button {
  flex: 0 0 32px;
  height: 32px;
  border: 1px solid var(--tool-border);
  border-radius: 6px;
  background: #fff;
  font-size: 20px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.12s;
}

.frame-strip > button:hover:not(:disabled) {
  border-color: var(--tool-primary);
  color: var(--tool-primary);
}

.frame-strip > button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.video-thumb {
  width: 100px;
  display: grid;
  place-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 6px 4px 4px;
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.12s;
  flex-shrink: 0;
}

.video-thumb:hover {
  border-color: #c8d4e2;
  background: rgba(33, 103, 232, 0.02);
}

.video-thumb.active {
  border-color: var(--tool-primary);
  background: rgba(33, 103, 232, 0.05);
}

.video-thumb .thumb-canvas {
  width: 84px;
  height: 56px;
  border-radius: 4px;
  background: #0a0a0a;
  display: block;
  image-rendering: pixelated;
  object-fit: contain;
}

.gallery-more {
  flex: 0 0 auto;
  padding: 0 10px;
  font-size: 10px;
  color: var(--tool-muted);
  text-align: center;
  line-height: 1.4;
}

.video-thumb span {
  width: 84px;
  height: 56px;
  border-radius: 4px;
  background: #0a0a0a;
  display: block;
  overflow: hidden;
}

.video-thumb small {
  font-size: 10px;
  color: var(--tool-muted);
  text-align: center;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
}

.video-thumb.empty-thumb span {
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #dfe6f0;
  background: #fbfdff;
}
</style>
