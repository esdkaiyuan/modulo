<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { useBatchModuloStore } from '../stores/batchModuloStore';

const store = useBatchModuloStore();
</script>

<template>
  <aside class="batch-side batch-config-column">
    <PanelSection class="batch-config-card" step="3" title="Configuration">
      <h3>Extraction Parameters <small>(Applied to All Files)</small></h3>
      <label class="field-label">Scanning Direction
        <select v-model="store.scanDirection">
          <option value="horizontal-ltr">Left to Right, Top to Bottom</option>
          <option value="horizontal-rtl">Right to Left, Top to Bottom</option>
          <option value="vertical-ttb">Top to Bottom, Left to Right</option>
          <option value="vertical-btt">Bottom to Top, Left to Right</option>
        </select>
      </label>
      <label class="field-label">Encoding Mode
        <select v-model="store.polarity"><option value="positive">1bpp Positive</option><option value="negative">1bpp Negative</option></select>
      </label>
      <label class="field-label">Bit Order
        <select v-model="store.bitOrder"><option value="msb">MSB First</option><option value="lsb">LSB First</option></select>
      </label>
      <label class="field-label">Dithering
        <select v-model="store.dithering"><option value="floyd-steinberg">Floyd-Steinberg</option><option value="none">None</option></select>
      </label>
      <label class="field-label">Target Width <input v-model.number="store.targetWidth" type="number" min="1" max="512" /></label>
      <label class="field-label">Target Height <input v-model.number="store.targetHeight" type="number" min="1" max="512" /></label>
      <label class="field-label">Threshold Value <input v-model.number="store.threshold" type="number" min="0" max="255" /></label>
      <button class="primary-btn wide" @click="store.reprocessAll">⇊ Apply to All</button>
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
