<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import SizeModeFields from '../components/SizeModeFields.vue';
import ColorModeFields from '../components/ColorModeFields.vue';
import { useVideoModuloStore } from '../features/video/stores/videoModuloStore';
import { t } from '../i18n';

const store = useVideoModuloStore();
const fileInput = ref<HTMLInputElement | null>(null);

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
  if (file) await store.loadVideoFile(file);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}

onBeforeUnmount(() => store.pause());
</script>

<template>
  <div class="tool-page">
    <div class="tool-toolbar">
      <span class="tool-title">{{ t('video.title') }}</span>
      <button class="btn primary" data-test="open-video" @click="pickFile">{{ t('video.open') }}</button>
      <span class="toolbar-spacer"></span>
      <span v-if="store.fileName" class="toolbar-info">
        {{ store.fileName }} · {{ store.sourceWidth }}×{{ store.sourceHeight }} ·
        {{ formatTime(store.duration) }}
      </span>
    </div>

    <div class="tool-main">
      <div v-if="store.extractError" class="alert-error">{{ store.extractError }}</div>
      <div v-if="store.isExtracting" class="extract-progress">
        <span>{{ t('video.extracting') }} {{ Math.round(store.extractProgress * 100) }}%</span>
        <div class="extract-progress-track">
          <div class="extract-progress-fill" :style="{ width: `${store.extractProgress * 100}%` }"></div>
        </div>
      </div>

      <Panel :title="t('video.source')">
        <div v-if="store.objectUrl" class="video-holder">
          <video :src="store.objectUrl" controls muted></video>
        </div>
        <div v-else class="drop-zone" @click="pickFile">
          <span class="big">🎬</span>
          <b>{{ t('video.drop') }}</b>
          <span>{{ t('video.dropTypes') }}</span>
        </div>
      </Panel>

      <Panel :title="t('image.preview', { w: store.targetWidth, h: store.targetHeight })">
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
            <span class="big">▦</span>
            <span>{{ t('video.emptyPreview') }}</span>
          </div>
        </div>
        <div v-if="store.hasFrames" class="media-controls">
          <button class="btn sm icon" @click="store.togglePlay()">{{ store.isPlaying ? '⏸' : '▶' }}</button>
          <input
            v-model.number="store.selectedIndex"
            type="range"
            min="0"
            :max="Math.max(0, store.processedFrames.length - 1)"
          />
          <span class="media-counter">
            {{ store.selectedIndex + 1 }} / {{ store.processedFrames.length }} ·
            {{ store.selectedFrame ? formatTime(store.selectedFrame.time) : '' }}
          </span>
        </div>
      </Panel>

      <Panel :title="t('video.gallery', { n: store.processedFrames.length })">
        <div v-if="store.hasFrames" class="frame-strip">
          <button
            v-for="(frame, index) in visibleFrames"
            :key="index"
            class="frame-thumb"
            :class="{ active: index === store.selectedIndex }"
            @click="store.selectedIndex = index"
          >
            <BitmapCanvas :bitmap="frame.bitmap" :rgba="frame.preview ?? null" :width="store.targetWidth" :height="store.targetHeight" :scale="1" />
            <small>{{ frame.time.toFixed(2) }}s</small>
          </button>
          <span v-if="hiddenCount" class="strip-more">{{ t('common.more', { n: hiddenCount }) }}</span>
        </div>
        <div v-else class="empty-state" style="min-height:90px">
          <span>{{ t('video.noFrames') }}</span>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel :title="t('video.extraction')">
        <div class="field-stack">
          <div class="field-row">
            <label class="field"><span>{{ t('video.startS') }}</span><input v-model.number="store.startTime" type="number" min="0" step="0.1" /></label>
            <label class="field"><span>{{ t('video.endS') }}</span><input v-model.number="store.endTime" type="number" min="0" step="0.1" /></label>
          </div>
          <div class="field-row">
            <label class="field">
              <span>{{ t('video.sampleRate') }}</span>
              <input v-model.number="store.sampleFps" type="number" min="1" max="60" />
            </label>
            <label class="field">
              <span>{{ t('video.per') }}</span>
              <select v-model="store.sampleUnit">
                <option value="second">{{ t('video.perSecond') }}</option>
                <option value="minute">{{ t('video.perMinute') }}</option>
              </select>
            </label>
          </div>
          <label class="field"><span>{{ t('video.outputFps') }}</span><input v-model.number="store.outputFps" type="number" min="1" max="60" /></label>
          <button class="btn primary" :disabled="!store.sourceFile || store.isExtracting" @click="store.reExtract()">
            {{ t('video.reExtract') }}
          </button>
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
          <div class="slider-field">
            <header><span>{{ t('common.brightness') }}</span><b>{{ store.brightness }}</b></header>
            <input v-model.number="store.brightness" type="range" min="-100" max="100" />
          </div>
          <div class="slider-field">
            <header><span>{{ t('common.contrast') }}</span><b>{{ store.contrast.toFixed(2) }}</b></header>
            <input v-model.number="store.contrast" type="range" min="0.2" max="3" step="0.05" />
          </div>
          <div class="field-row">
            <label class="field">
              <span>{{ t('common.scaling') }}</span>
              <select v-model="store.scalingAlgorithm">
                <option value="nearest">{{ t('common.nearest') }}</option>
                <option value="bilinear">{{ t('common.bilinear') }}</option>
              </select>
            </label>
            <label class="field">
              <span>{{ t('common.dithering') }}</span>
              <select v-model="store.dithering">
                <option value="none">{{ t('common.none') }}</option>
                <option value="floyd-steinberg">Floyd-Steinberg</option>
              </select>
            </label>
          </div>
        </div>
      </Panel>

      <Panel v-if="store.colorMode === 'mono'" :title="t('common.encoding')">
        <EncodingFields :store="store" />
      </Panel>

      <Panel :title="t('common.stats')">
        <div class="stat-list">
          <div class="stat-row"><span>{{ t('video.extractedFrames') }}</span><b>{{ store.extractedFrames.length }}</b></div>
          <div class="stat-row"><span>{{ t('video.processedFrames') }}</span><b>{{ store.processedFrames.length }}</b></div>
          <div class="stat-row"><span>{{ t('video.bytesPerFrame') }}</span><b>{{ store.bytesPerFrame }}</b></div>
          <div class="stat-row"><span>{{ t('video.totalSize') }}</span><b>{{ (store.estimatedBytes / 1024).toFixed(2) }} KB</b></div>
        </div>
      </Panel>
    </aside>

    <div class="tool-output">
      <CodeOutput
        :source="store.hasFrames ? store.generatedSource : ''"
        :name="store.outputName"
        :width="store.targetWidth"
        :height="store.targetHeight"
        :frames="store.processedFrames.map((f) => Array.from(f.bytes))"
        :extra="{ fps: store.outputFps }"
      />
    </div>

    <input ref="fileInput" type="file" class="hidden-input" accept="video/*" @change="onFileChange" />
  </div>
</template>
