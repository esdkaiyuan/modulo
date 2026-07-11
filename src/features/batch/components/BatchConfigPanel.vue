<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { useBatchModuloStore } from '../stores/batchModuloStore';

const store = useBatchModuloStore();
</script>

<template>
  <aside class="batch-side batch-config-column">
    <PanelSection class="batch-config-card" step="3" title="Configuration">
      <div class="field-label" data-test="batch-mode"><strong>Modulo Mode</strong><div class="segmented-control"><button type="button" :class="{ active: store.mode === 'mono' }" @click="store.mode = 'mono'">Mono</button><button type="button" :class="{ active: store.mode !== 'mono' }" @click="store.mode = 'rgb565'">Color</button></div></div>
      <label v-if="store.mode !== 'mono'" class="field-label">Color Encoding<select v-model="store.mode" data-test="batch-color-encoding"><option value="rgb565">RGB565</option><option value="rgb888">RGB888</option><option value="palette16">16-color Palette</option></select></label>
      <label class="field-label">Output Format<select v-model="store.exportFormat" data-test="batch-export-format"><option value="c-array">C Array</option><option value="hex">HEX Text</option><option value="bin">BIN Binary</option></select></label>
      <label class="field-label">Parameter Preset <select><option>Preset 1</option></select></label>
      <div class="segmented"><button>Preset 1</button><button>Preset 2</button><button>Custom</button><button>▣</button></div>
      <h3>Extraction Parameters <small>(Applied to All Files)</small></h3>
      <label class="field-label">Scanning Direction
        <select v-model="store.scanDirection">
          <option value="horizontal-ltr">Left to Right, Top to Bottom</option>
          <option value="horizontal-rtl">Right to Left, Top to Bottom</option>
          <option value="vertical-ttb">Top to Bottom, Left to Right</option>
          <option value="vertical-btt">Bottom to Top, Left to Right</option>
        </select>
      </label>
      <label v-if="store.mode === 'mono'" class="field-label">Encoding Mode
        <select v-model="store.polarity"><option value="positive">1bpp Positive</option><option value="negative">1bpp Negative</option></select>
      </label>
      <label v-if="store.mode === 'mono'" class="field-label">Bit Order
        <select v-model="store.bitOrder"><option value="msb">MSB First</option><option value="lsb">LSB First</option></select>
      </label>
      <label v-if="store.mode === 'mono'" class="field-label">Dithering
        <select v-model="store.dithering"><option value="floyd-steinberg">Floyd-Steinberg</option><option value="none">None</option></select>
      </label>
      <label class="field-label">Target Width <input v-model.number="store.targetWidth" type="number" min="1" max="512" /></label>
      <label class="field-label">Target Height <input v-model.number="store.targetHeight" type="number" min="1" max="512" /></label>
      <label v-if="store.mode === 'mono'" class="field-label">Threshold Value <input v-model.number="store.threshold" type="number" min="0" max="255" /></label>
      <label v-if="store.mode === 'rgb565'" class="field-label">Byte Order<select v-model="store.rgb565ByteOrder"><option value="msb-first">High Byte First</option><option value="lsb-first">Low Byte First</option></select></label>
      <label v-if="store.mode === 'rgb888'" class="field-label">Channel Order<select v-model="store.rgb888Order"><option value="rgb">RGB</option><option value="bgr">BGR</option></select></label>
      <label v-if="store.mode !== 'mono'" class="field-label">Transparent Pixel Color<input v-model="store.transparentBackground" type="color" /></label>
      <button class="primary-btn wide" @click="store.processAll">⇊ Apply to All</button>
    </PanelSection>
    <PanelSection class="batch-summary-card" title="Summary Statistics">
      <div class="stats-row">
        <div><span>Total Files</span><strong>{{ store.summary.total }}</strong></div>
        <div><span>Completed</span><strong>{{ store.summary.completed }}</strong></div>
        <div><span>Failed</span><strong>{{ store.summary.failed }}</strong></div>
        <div><span>Pending</span><strong>{{ store.summary.pending }}</strong></div>
      </div>
    </PanelSection>
  </aside>
</template>
