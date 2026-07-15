<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import { useAnimationModuloStore } from '../features/animation/stores/animationModuloStore';
import { decodeGif } from '../features/animation/utils/gifDecoder';

const store = useAnimationModuloStore();
const fileInput = ref<HTMLInputElement | null>(null);
const loadError = ref('');
const isPlaying = ref(false);
let playTimer: ReturnType<typeof setTimeout> | null = null;

const MAX_THUMBS = 40;
const visibleFrames = computed(() => store.processedFrames.slice(0, MAX_THUMBS));
const hiddenCount = computed(() => Math.max(0, store.processedFrames.length - MAX_THUMBS));
const previewScale = computed(() => {
  const max = Math.max(store.targetWidth, store.targetHeight);
  return max <= 64 ? 5 : max <= 128 ? 3 : 2;
});

function pickFile() {
  fileInput.value?.click();
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  loadError.value = '';
  stop();
  try {
    const decoded = decodeGif(await file.arrayBuffer());
    if (!decoded.frames.length) throw new Error('No frames found in this GIF');
    store.loadDecodedFrames({ fileName: file.name, width: decoded.width, height: decoded.height, frames: decoded.frames });
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'GIF decode failed';
  }
}

// ── Delay-accurate playback ──────────────────────────
function scheduleNext() {
  const frame = store.selectedFrame;
  const delay = Math.max(20, frame?.delay ?? 100);
  playTimer = setTimeout(() => {
    store.selectedIndex = store.selectedIndex >= store.processedFrames.length - 1
      ? 0
      : store.selectedIndex + 1;
    if (isPlaying.value) scheduleNext();
  }, delay);
}

function play() {
  if (isPlaying.value || !store.processedFrames.length) return;
  isPlaying.value = true;
  scheduleNext();
}

function stop() {
  isPlaying.value = false;
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
}

function togglePlay() {
  isPlaying.value ? stop() : play();
}

function step(delta: number) {
  stop();
  const count = store.processedFrames.length;
  if (!count) return;
  store.selectedIndex = (store.selectedIndex + delta + count) % count;
}

onBeforeUnmount(stop);
</script>

<template>
  <div class="tool-page">
    <div class="tool-toolbar">
      <span class="tool-title">◧ Animation Frames</span>
      <button class="btn primary" data-test="open-gif" @click="pickFile">Open GIF</button>
      <span class="toolbar-spacer"></span>
      <span v-if="store.fileName" class="toolbar-info">
        {{ store.fileName }} · {{ store.sourceWidth }}×{{ store.sourceHeight }} ·
        {{ store.decodedFrames.length }} frames · {{ (store.totalDuration / 1000).toFixed(2) }}s
      </span>
    </div>

    <div class="tool-main">
      <div v-if="loadError" class="alert-error">{{ loadError }}</div>

      <Panel :title="`Animation Preview (${store.targetWidth}×${store.targetHeight})`">
        <div class="canvas-frame">
          <BitmapCanvas
            v-if="store.selectedFrame"
            :bitmap="store.selectedFrame.bitmap"
            :width="store.targetWidth"
            :height="store.targetHeight"
            :scale="previewScale"
          />
          <div v-else class="empty-state">
            <span class="big">◧</span>
            <span>Load a GIF to extract and preview frames</span>
          </div>
        </div>
        <div v-if="store.processedFrames.length" class="media-controls">
          <button class="btn sm icon" data-test="anim-play" @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</button>
          <button class="btn sm icon" @click="step(-1)">‹</button>
          <button class="btn sm icon" @click="step(1)">›</button>
          <input
            :value="store.selectedIndex"
            type="range"
            min="0"
            :max="Math.max(0, store.processedFrames.length - 1)"
            @input="stop(); store.selectedIndex = Number(($event.target as HTMLInputElement).value)"
          />
          <span class="media-counter">
            {{ store.selectedIndex + 1 }} / {{ store.processedFrames.length }} ·
            {{ store.selectedFrame?.delay ?? 0 }} ms
          </span>
        </div>
      </Panel>

      <Panel :title="`Frames (${store.processedFrames.length})`">
        <div v-if="store.processedFrames.length" class="frame-strip">
          <button
            v-for="(frame, index) in visibleFrames"
            :key="index"
            class="frame-thumb"
            :class="{ active: index === store.selectedIndex }"
            @click="stop(); store.selectedIndex = index"
          >
            <BitmapCanvas :bitmap="frame.bitmap" :width="store.targetWidth" :height="store.targetHeight" :scale="1" />
            <small>#{{ frame.sourceIndex }} · {{ frame.delay }}ms</small>
          </button>
          <span v-if="hiddenCount" class="strip-more">+{{ hiddenCount }} more</span>
        </div>
        <div v-else class="empty-state" style="min-height:90px">
          <span>Load a GIF to extract frames</span>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel title="Frame Range">
        <div class="field-stack">
          <div class="field-row">
            <label class="field"><span>Start Frame</span><input v-model.number="store.startFrame" type="number" min="1" :max="store.decodedFrames.length || 1" /></label>
            <label class="field"><span>End Frame</span><input v-model.number="store.endFrame" type="number" min="1" :max="store.decodedFrames.length || 1" /></label>
          </div>
          <label class="field">
            <span>Sample Step</span>
            <select v-model.number="store.sampleStep">
              <option :value="1">Every frame</option>
              <option :value="2">Every 2nd frame</option>
              <option :value="3">Every 3rd frame</option>
              <option :value="5">Every 5th frame</option>
              <option :value="10">Every 10th frame</option>
            </select>
          </label>
        </div>
      </Panel>

      <Panel title="Frame Processing">
        <div class="field-stack">
          <div class="field-row">
            <label class="field"><span>Width</span><input v-model.number="store.targetWidth" type="number" min="8" max="512" /></label>
            <label class="field"><span>Height</span><input v-model.number="store.targetHeight" type="number" min="8" max="512" /></label>
          </div>
          <div class="slider-field">
            <header><span>Threshold</span><b>{{ store.threshold }}</b></header>
            <input v-model.number="store.threshold" type="range" min="0" max="255" />
          </div>
          <label class="field">
            <span>Dithering</span>
            <select v-model="store.dithering">
              <option value="none">None</option>
              <option value="floyd-steinberg">Floyd-Steinberg</option>
            </select>
          </label>
        </div>
      </Panel>

      <Panel title="Encoding">
        <EncodingFields :store="store" />
      </Panel>

      <Panel title="Stats">
        <div class="stat-list">
          <div class="stat-row"><span>Decoded frames</span><b>{{ store.decodedFrames.length }}</b></div>
          <div class="stat-row"><span>Output frames</span><b>{{ store.processedFrames.length }}</b></div>
          <div class="stat-row"><span>Bytes / frame</span><b>{{ store.bytesPerFrame }}</b></div>
          <div class="stat-row"><span>Total duration</span><b>{{ (store.totalDuration / 1000).toFixed(2) }} s</b></div>
        </div>
      </Panel>
    </aside>

    <div class="tool-output">
      <CodeOutput
        :source="store.processedFrames.length ? store.generatedSource : ''"
        :name="store.outputName"
        :width="store.targetWidth"
        :height="store.targetHeight"
        :frames="store.processedFrames.map((f) => Array.from(f.bytes))"
        :extra="{ delays: store.delayTable }"
      />
    </div>

    <input ref="fileInput" type="file" class="hidden-input" accept="image/gif" @change="onFileChange" />
  </div>
</template>
