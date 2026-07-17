<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import SizeModeFields from '../components/SizeModeFields.vue';
import ColorModeFields from '../components/ColorModeFields.vue';
import { useAnimationModuloStore } from '../features/animation/stores/animationModuloStore';
import { ANIMATION_ACCEPT, decodeAnimationFile } from '../features/animation/utils/animationDecoder';
import { t } from '../i18n';

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
    const decoded = await decodeAnimationFile(file);
    if (!decoded.frames.length) throw new Error('No frames found in this file');
    store.loadDecodedFrames({ fileName: file.name, width: decoded.width, height: decoded.height, frames: decoded.frames });
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Image decode failed';
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
      <span class="tool-title">{{ t('anim.title') }}</span>
      <button class="btn primary" data-test="open-gif" @click="pickFile">{{ t('anim.open') }}</button>
      <span class="toolbar-spacer"></span>
      <span v-if="store.fileName" class="toolbar-info">
        {{ store.fileName }} · {{ store.sourceWidth }}×{{ store.sourceHeight }} ·
        {{ store.decodedFrames.length }} {{ t('common.frames') }} · {{ (store.totalDuration / 1000).toFixed(2) }}s
      </span>
    </div>

    <div class="tool-main">
      <div v-if="loadError" class="alert-error">{{ loadError }}</div>

      <Panel :title="t('anim.preview', { w: store.targetWidth, h: store.targetHeight })">
        <div class="canvas-frame">
          <BitmapCanvas
            v-if="store.selectedFrame"
            :bitmap="store.selectedFrame.bitmap"
            :rgba="store.selectedFrame.preview ?? null"
            :width="store.targetWidth"
            :height="store.targetHeight"
            :scale="previewScale"
          />
          <div v-else class="empty-state">
            <span class="big">◧</span>
            <span>{{ t('anim.emptyPreview') }}</span>
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

      <Panel :title="t('anim.frames', { n: store.processedFrames.length })">
        <div v-if="store.processedFrames.length" class="frame-strip">
          <button
            v-for="(frame, index) in visibleFrames"
            :key="index"
            class="frame-thumb"
            :class="{ active: index === store.selectedIndex }"
            @click="stop(); store.selectedIndex = index"
          >
            <BitmapCanvas :bitmap="frame.bitmap" :rgba="frame.preview ?? null" :width="store.targetWidth" :height="store.targetHeight" :scale="1" />
            <small>#{{ frame.sourceIndex }} · {{ frame.delay }}ms</small>
          </button>
          <span v-if="hiddenCount" class="strip-more">{{ t('common.more', { n: hiddenCount }) }}</span>
        </div>
        <div v-else class="empty-state" style="min-height:90px">
          <span>{{ t('anim.emptyFrames') }}</span>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel :title="t('anim.frameRange')">
        <div class="field-stack">
          <div class="field-row">
            <label class="field"><span>{{ t('anim.startFrame') }}</span><input v-model.number="store.startFrame" type="number" min="1" :max="store.decodedFrames.length || 1" /></label>
            <label class="field"><span>{{ t('anim.endFrame') }}</span><input v-model.number="store.endFrame" type="number" min="1" :max="store.decodedFrames.length || 1" /></label>
          </div>
          <label class="field">
            <span>{{ t('anim.sampling') }}</span>
            <select v-model="store.samplingMode">
              <option value="step">{{ t('anim.byStep') }}</option>
              <option value="count">{{ t('anim.byCount') }}</option>
            </select>
          </label>
          <label v-if="store.samplingMode === 'step'" class="field">
            <span>{{ t('anim.sampleStep') }}</span>
            <input v-model.number="store.sampleStep" type="number" min="1" :max="store.decodedFrames.length || 1" />
          </label>
          <label v-else class="field">
            <span>{{ t('anim.outputFrames') }}</span>
            <input v-model.number="store.targetFrameCount" type="number" min="1" :max="store.decodedFrames.length || 1" />
          </label>
        </div>
      </Panel>

      <Panel :title="t('video.frameProcessing')">
        <div class="field-stack">
          <SizeModeFields :store="store" />
          <ColorModeFields :store="store" />
          <div v-if="store.colorMode === 'mono'" class="slider-field">
            <header><span>{{ t('common.threshold') }}</span><b>{{ store.threshold }}</b></header>
            <input v-model.number="store.threshold" type="range" min="0" max="255" />
          </div>
          <label class="field">
            <span>{{ t('common.dithering') }}</span>
            <select v-model="store.dithering">
              <option value="none">{{ t('common.none') }}</option>
              <option value="floyd-steinberg">Floyd-Steinberg</option>
            </select>
          </label>
        </div>
      </Panel>

      <Panel v-if="store.colorMode === 'mono'" :title="t('common.encoding')">
        <EncodingFields :store="store" />
      </Panel>

      <Panel :title="t('common.stats')">
        <div class="stat-list">
          <div class="stat-row"><span>{{ t('anim.decodedFrames') }}</span><b>{{ store.decodedFrames.length }}</b></div>
          <div class="stat-row"><span>{{ t('anim.outputFrames') }}</span><b>{{ store.processedFrames.length }}</b></div>
          <div class="stat-row"><span>{{ t('video.bytesPerFrame') }}</span><b>{{ store.bytesPerFrame }}</b></div>
          <div class="stat-row"><span>{{ t('anim.totalDuration') }}</span><b>{{ (store.totalDuration / 1000).toFixed(2) }} s</b></div>
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

    <input ref="fileInput" type="file" class="hidden-input" :accept="ANIMATION_ACCEPT" @change="onFileChange" />
  </div>
</template>
