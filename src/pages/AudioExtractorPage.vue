<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Panel from '../components/Panel.vue';
import CodeOutput from '../components/CodeOutput.vue';
import { waveformEnvelope, SAMPLE_RATES } from '../engines/audioProcessor';
import { useAudioModuloStore } from '../features/audio/stores/audioModuloStore';
import { t } from '../i18n';

const store = useAudioModuloStore();
const fileInput = ref<HTMLInputElement | null>(null);
const waveCanvas = ref<HTMLCanvasElement | null>(null);

const isClipping = computed(() => !store.normalize && store.peak >= 1);

function pickFile() {
  fileInput.value?.click();
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) await store.loadAudioFile(file);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2);
  return `${m}:${s.padStart(5, '0')}`;
}

// ── Waveform rendering ───────────────────────────────
function drawWaveform() {
  const el = waveCanvas.value;
  if (!el) return;
  const width = el.clientWidth || 600;
  const height = 160;
  el.width = width;
  el.height = height;
  const ctx = el.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#10141b';
  ctx.fillRect(0, 0, width, height);

  const mid = height / 2;
  ctx.strokeStyle = 'rgba(148,163,184,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, mid + 0.5);
  ctx.lineTo(width, mid + 0.5);
  ctx.stroke();

  const samples = store.samples;
  if (!samples.length) return;
  const envelope = waveformEnvelope(samples, width);
  ctx.fillStyle = '#3ddc84';
  for (let x = 0; x < width; x += 1) {
    const min = envelope[x * 2];
    const max = envelope[x * 2 + 1];
    const y1 = mid - max * (mid - 4);
    const y2 = mid - min * (mid - 4);
    ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
  }
}

watch(() => [store.samples, store.hasAudio], () => requestAnimationFrame(drawWaveform), { flush: 'post' });

onBeforeUnmount(() => store.stopPlayback());
</script>

<template>
  <div class="tool-page">
    <div class="tool-toolbar">
      <span class="tool-title">{{ t('audio.title') }}</span>
      <button class="btn primary" data-test="open-audio" @click="pickFile">{{ t('audio.open') }}</button>
      <button class="btn" :disabled="!store.hasAudio" @click="store.reset()">{{ t('common.reset') }}</button>
      <span class="toolbar-spacer"></span>
      <span v-if="store.fileName" class="toolbar-info">
        {{ store.fileName }} · {{ (store.fileSize / 1024).toFixed(1) }} KB ·
        {{ store.sourceSampleRate }} Hz · {{ formatTime(store.duration) }}
      </span>
    </div>

    <div class="tool-main">
      <div v-if="store.loadError" class="alert-error">{{ store.loadError }}</div>

      <Panel :title="t('audio.source')">
        <div v-if="store.objectUrl" class="audio-holder">
          <audio :src="store.objectUrl" controls style="width:100%"></audio>
        </div>
        <div v-else class="drop-zone" @click="pickFile">
          <span class="big">♪</span>
          <b>{{ t('audio.drop') }}</b>
          <span>{{ t('audio.dropTypes') }}</span>
        </div>
      </Panel>

      <Panel :title="t('audio.waveform', { n: store.samples.length })">
        <div class="canvas-frame" style="padding:0">
          <canvas v-show="store.hasAudio" ref="waveCanvas" style="width:100%;display:block"></canvas>
          <div v-if="!store.hasAudio" class="empty-state">
            <span class="big">∿</span>
            <span>{{ t('audio.emptyWaveform') }}</span>
          </div>
        </div>
        <div v-if="store.hasAudio" class="media-controls">
          <button class="btn sm" data-test="audio-play" @click="store.isPlaying ? store.stopPlayback() : store.playProcessed()">
            {{ store.isPlaying ? t('audio.stop') : t('audio.playProcessed') }}
          </button>
          <span v-if="store.isProcessing" class="media-counter">{{ t('audio.processing') }}</span>
          <span v-else-if="isClipping" class="media-counter" style="color:#f87171">{{ t('audio.clipWarning') }}</span>
          <span v-else class="media-counter">{{ store.sampleRate }} Hz · {{ store.bitDepth }} bit · mono</span>
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel :title="t('audio.range')">
        <div class="field-stack">
          <div class="field-row">
            <label class="field"><span>{{ t('video.startS') }}</span><input v-model.number="store.startTime" type="number" min="0" :max="store.duration" step="0.1" /></label>
            <label class="field"><span>{{ t('video.endS') }}</span><input v-model.number="store.endTime" type="number" min="0" :max="Math.ceil(store.duration * 100) / 100" step="0.1" /></label>
          </div>
        </div>
      </Panel>

      <Panel :title="t('audio.format')">
        <div class="field-stack">
          <label class="field">
            <span>{{ t('audio.sampleRate') }}</span>
            <select v-model.number="store.sampleRate" data-test="audio-rate">
              <option v-for="rate in SAMPLE_RATES" :key="rate" :value="rate">{{ rate }} Hz</option>
            </select>
          </label>
          <label class="field">
            <span>{{ t('audio.bitDepth') }}</span>
            <select v-model.number="store.bitDepth" data-test="audio-depth">
              <option :value="8">{{ t('audio.bit8') }}</option>
              <option :value="16">{{ t('audio.bit16') }}</option>
            </select>
          </label>
          <label v-if="store.bitDepth === 16" class="field">
            <span>{{ t('color.byteOrder') }}</span>
            <select v-model="store.byteOrder" data-test="audio-byte-order">
              <option value="little">{{ t('color.littleEndian') }}</option>
              <option value="big">{{ t('color.bigEndian') }}</option>
            </select>
          </label>
          <label class="check"><input v-model="store.normalize" type="checkbox" /> {{ t('audio.normalize') }}</label>
          <div v-if="!store.normalize" class="slider-field">
            <header><span>{{ t('audio.gain') }}</span><b>{{ store.gain.toFixed(2) }}×</b></header>
            <input v-model.number="store.gain" type="range" min="0.1" max="4" step="0.05" />
          </div>
        </div>
      </Panel>

      <Panel :title="t('common.stats')">
        <div class="stat-list">
          <div class="stat-row"><span>{{ t('audio.sourceRate') }}</span><b>{{ store.sourceSampleRate || '—' }} Hz</b></div>
          <div class="stat-row"><span>{{ t('audio.channels') }}</span><b>{{ store.sourceChannels || '—' }}</b></div>
          <div class="stat-row"><span>{{ t('audio.clipLength') }}</span><b>{{ store.clipDuration.toFixed(2) }} s</b></div>
          <div class="stat-row"><span>{{ t('audio.samples') }}</span><b>{{ store.samples.length }}</b></div>
          <div class="stat-row"><span>{{ t('audio.dataSize') }}</span><b>{{ (store.bytes.length / 1024).toFixed(2) }} KB</b></div>
        </div>
      </Panel>
    </aside>

    <div class="tool-output">
      <CodeOutput
        :source="store.generatedSource"
        :name="store.outputName"
        :width="store.samples.length"
        :height="1"
        :bytes="Array.from(store.bytes)"
        :extra="{ sampleRate: store.sampleRate, bitDepth: store.bitDepth }"
      />
    </div>

    <input ref="fileInput" type="file" class="hidden-input" accept="audio/*" @change="onFileChange" />
  </div>
</template>
