<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import Panel from '../components/Panel.vue';
import BitmapCanvas from '../components/BitmapCanvas.vue';
import CodeOutput from '../components/CodeOutput.vue';
import EncodingFields from '../components/EncodingFields.vue';
import { useVideoModuloStore } from '../features/video/stores/videoModuloStore';

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
      <span class="tool-title">▶ Video Extractor</span>
      <button class="btn primary" data-test="open-video" @click="pickFile">Open Video</button>
      <span class="toolbar-spacer"></span>
      <span v-if="store.fileName" class="toolbar-info">
        {{ store.fileName }} · {{ store.sourceWidth }}×{{ store.sourceHeight }} ·
        {{ formatTime(store.duration) }}
      </span>
    </div>

    <div class="tool-main">
      <div v-if="store.extractError" class="alert-error">{{ store.extractError }}</div>
      <div v-if="store.isExtracting" class="alert-error" style="border-color:#93c5fd;background:#eff6ff;color:#1d4ed8">
        Extracting frames… this can take a moment for long clips.
      </div>

      <Panel title="Source Video">
        <div v-if="store.objectUrl" class="video-holder">
          <video :src="store.objectUrl" controls muted></video>
        </div>
        <div v-else class="drop-zone" @click="pickFile">
          <span class="big">🎬</span>
          <b>Open a video file to begin</b>
          <span>MP4 · WebM · up to 200 MB</span>
        </div>
      </Panel>

      <Panel :title="`Dot Matrix Preview (${store.targetWidth}×${store.targetHeight})`">
        <div class="canvas-frame">
          <BitmapCanvas
            v-if="store.selectedFrame"
            :bitmap="store.selectedFrame.bitmap"
            :width="store.targetWidth"
            :height="store.targetHeight"
            :scale="previewScale"
          />
          <div v-else class="empty-state">
            <span class="big">▦</span>
            <span>Load a video to generate the dot matrix preview</span>
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

      <Panel :title="`Frame Gallery (${store.processedFrames.length})`">
        <div v-if="store.hasFrames" class="frame-strip">
          <button
            v-for="(frame, index) in visibleFrames"
            :key="index"
            class="frame-thumb"
            :class="{ active: index === store.selectedIndex }"
            @click="store.selectedIndex = index"
          >
            <BitmapCanvas :bitmap="frame.bitmap" :width="store.targetWidth" :height="store.targetHeight" :scale="1" />
            <small>{{ frame.time.toFixed(2) }}s</small>
          </button>
          <span v-if="hiddenCount" class="strip-more">+{{ hiddenCount }} more</span>
        </div>
        <div v-else class="empty-state" style="min-height:90px">
          <span>No frames extracted yet</span>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel title="Extraction">
        <div class="field-stack">
          <div class="field-row">
            <label class="field"><span>Start (s)</span><input v-model.number="store.startTime" type="number" min="0" step="0.1" /></label>
            <label class="field"><span>End (s)</span><input v-model.number="store.endTime" type="number" min="0" step="0.1" /></label>
          </div>
          <div class="field-row">
            <label class="field">
              <span>Sample FPS</span>
              <select v-model.number="store.sampleFps">
                <option :value="5">5 fps</option>
                <option :value="10">10 fps</option>
                <option :value="15">15 fps</option>
                <option :value="30">30 fps</option>
              </select>
            </label>
            <label class="field"><span>Output FPS</span><input v-model.number="store.outputFps" type="number" min="1" max="60" /></label>
          </div>
          <button class="btn primary" :disabled="!store.sourceFile || store.isExtracting" @click="store.reExtract()">
            ⟳ Re-extract Frames
          </button>
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
          <div class="slider-field">
            <header><span>Brightness</span><b>{{ store.brightness }}</b></header>
            <input v-model.number="store.brightness" type="range" min="-100" max="100" />
          </div>
          <div class="slider-field">
            <header><span>Contrast</span><b>{{ store.contrast.toFixed(2) }}</b></header>
            <input v-model.number="store.contrast" type="range" min="0.2" max="3" step="0.05" />
          </div>
          <div class="field-row">
            <label class="field">
              <span>Scaling</span>
              <select v-model="store.scalingAlgorithm">
                <option value="nearest">Nearest</option>
                <option value="bilinear">Bilinear</option>
              </select>
            </label>
            <label class="field">
              <span>Dithering</span>
              <select v-model="store.dithering">
                <option value="none">None</option>
                <option value="floyd-steinberg">Floyd-Steinberg</option>
              </select>
            </label>
          </div>
        </div>
      </Panel>

      <Panel title="Encoding">
        <EncodingFields :store="store" />
      </Panel>

      <Panel title="Stats">
        <div class="stat-list">
          <div class="stat-row"><span>Extracted frames</span><b>{{ store.extractedFrames.length }}</b></div>
          <div class="stat-row"><span>Processed frames</span><b>{{ store.processedFrames.length }}</b></div>
          <div class="stat-row"><span>Bytes / frame</span><b>{{ store.bytesPerFrame }}</b></div>
          <div class="stat-row"><span>Total size</span><b>{{ (store.estimatedBytes / 1024).toFixed(2) }} KB</b></div>
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
