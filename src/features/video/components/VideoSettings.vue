<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { useVideoModuloStore } from '../stores/videoModuloStore';

const store = useVideoModuloStore();
</script>

<template>
  <aside class="video-settings">
    <PanelSection title="Extract Settings">
      <div class="settings-grid">
        <label class="field-label">
          <span>Start Time</span>
          <input v-model.number="store.startTime" type="number" min="0" step="0.1" />
        </label>
        <label class="field-label">
          <span>End Time</span>
          <input v-model.number="store.endTime" type="number" min="0" step="0.1" />
        </label>
        <label class="field-label">
          <span>Sample FPS</span>
          <select v-model.number="store.sampleFps">
            <option :value="10">10 fps</option>
            <option :value="15">15 fps</option>
            <option :value="30">30 fps</option>
          </select>
        </label>
        <label class="field-label">
          <span>Output FPS</span>
          <input v-model.number="store.outputFps" type="number" min="1" max="60" />
        </label>
      </div>
      <button class="ghost-primary wide action-btn" :disabled="store.isExtracting" @click="store.reExtract">
        {{ store.isExtracting ? 'Extracting…' : 'Re-extract Frames' }}
      </button>
    </PanelSection>

    <PanelSection title="Frame Settings">
      <div class="settings-grid">
        <label class="field-label">
          <span>Width</span>
          <input v-model.number="store.targetWidth" type="number" min="8" max="512" />
        </label>
        <label class="field-label">
          <span>Height</span>
          <input v-model.number="store.targetHeight" type="number" min="8" max="512" />
        </label>
        <label class="field-label">
          <span>Threshold</span>
          <input v-model.number="store.threshold" type="number" min="0" max="255" />
        </label>
        <label class="field-label">
          <span>Brightness</span>
          <input v-model.number="store.brightness" type="number" min="-100" max="100" />
        </label>
        <label class="field-label">
          <span>Contrast</span>
          <input v-model.number="store.contrast" type="number" min="0.2" max="3" step="0.05" />
        </label>
        <label class="field-label">
          <span>Dithering</span>
          <select v-model="store.dithering">
            <option value="none">None</option>
            <option value="floyd-steinberg">Floyd-Steinberg</option>
          </select>
        </label>
        <label class="field-label">
          <span>Scaling</span>
          <select v-model="store.scalingAlgorithm">
            <option value="nearest">Nearest</option>
            <option value="bilinear">Bilinear</option>
          </select>
        </label>
      </div>
    </PanelSection>

    <PanelSection title="Output Settings">
      <div class="settings-grid">
        <label class="field-label">
          <span>Scan Direction</span>
          <select v-model="store.scanDirection">
            <option value="horizontal-ltr">L &rarr; R, Top &darr;</option>
            <option value="horizontal-rtl">R &rarr; L, Top &darr;</option>
            <option value="vertical-ttb">Top &darr; Bottom, L &rarr; R</option>
            <option value="vertical-btt">Bottom &uarr; Top, L &rarr; R</option>
          </select>
        </label>
        <label class="field-label">
          <span>Polarity</span>
          <select v-model="store.polarity">
            <option value="positive">Positive (1bpp)</option>
            <option value="negative">Inverted</option>
          </select>
        </label>
        <label class="field-label">
          <span>Bit Order</span>
          <select v-model="store.bitOrder">
            <option value="msb">MSB First</option>
            <option value="lsb">LSB First</option>
          </select>
        </label>
      </div>
      <button class="primary-btn wide action-btn" @click="store.processAll">
        Generate All
      </button>
      <div class="stat-list">
        <div class="stat-row">
          <span class="stat-label">Total Frames</span>
          <span class="stat-value">{{ store.extractedFrames.length }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Processed</span>
          <span class="stat-value">{{ store.processedFrames.length }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Est. Size</span>
          <span class="stat-value">{{ store.estimatedBytes ? (store.estimatedBytes / 1024).toFixed(1) + ' KB' : '0 B' }}</span>
        </div>
      </div>
    </PanelSection>
  </aside>
</template>

<style scoped>
.video-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-content: start;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-width: 0;
}

.field-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 7px 14px;
  color: #111827;
  font-size: 12px;
  min-width: 0;
}

.field-label > span {
  font-weight: 600;
  color: var(--tool-muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-label input,
.field-label select {
  min-height: 28px;
  width: 100%;
  min-width: 0;
  border: 1px solid var(--tool-border);
  border-radius: 5px;
  padding: 0 8px;
  background: #fff;
  font-size: 12px;
  color: var(--tool-text);
}

.action-btn {
  margin: 8px 14px 0;
  width: calc(100% - 28px);
  min-height: 32px;
  font-size: 12px;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 10px 14px 14px;
  border: 1px solid var(--tool-border-soft);
  border-radius: 6px;
  background: var(--tool-bg);
  overflow: hidden;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 10px;
  font-size: 12px;
}

.stat-row:not(:last-child) {
  border-bottom: 1px solid var(--tool-border-soft);
}

.stat-label {
  color: var(--tool-muted);
  font-weight: 500;
}

.stat-value {
  color: var(--tool-primary);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
