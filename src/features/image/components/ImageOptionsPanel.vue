<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useImageModuloStore } from '../stores/imageModuloStore';

const store = useImageModuloStore();

watch(
  () => [
    store.targetWidth,
    store.targetHeight,
    store.brightness,
    store.contrast,
    store.threshold,
    store.dithering,
    store.scanDirection,
    store.bitOrder,
    store.polarity
  ],
  () => store.process()
);
</script>

<template>
  <PanelSection class="image-options" step="3" title="Processing Options">
    <label class="field-label">Target Width<input v-model.number="store.targetWidth" type="number" min="1" max="512" /></label>
    <label class="field-label">Target Height<input v-model.number="store.targetHeight" type="number" min="1" max="512" /></label>
    <label class="field-label">Brightness<input v-model.number="store.brightness" type="range" min="-100" max="100" /><span>{{ store.brightness }}</span></label>
    <label class="field-label">Contrast<input v-model.number="store.contrast" type="range" min="0.2" max="3" step="0.05" /><span>{{ store.contrast.toFixed(2) }}</span></label>
    <label class="field-label">Threshold<input v-model.number="store.threshold" type="range" min="0" max="255" /><span>{{ store.threshold }}</span></label>
    <label class="field-label">
      Scaling Algorithm
      <select v-model="store.scalingAlgorithm"><option value="nearest">Nearest Neighbor</option></select>
    </label>
    <label class="field-label">
      Dithering
      <select v-model="store.dithering"><option value="floyd-steinberg">Floyd-Steinberg</option><option value="none">None</option></select>
    </label>
    <label class="field-label">
      Scan Direction
      <select v-model="store.scanDirection">
        <option value="horizontal-ltr">Left to Right, Top to Bottom</option>
        <option value="horizontal-rtl">Right to Left, Top to Bottom</option>
        <option value="vertical-ttb">Top to Bottom, Left to Right</option>
        <option value="vertical-btt">Bottom to Top, Left to Right</option>
      </select>
    </label>
    <label class="field-label">
      Encoding Mode
      <select v-model="store.polarity"><option value="positive">1 Bit Per Pixel (Monochrome)</option><option value="negative">Inverted Monochrome</option></select>
    </label>
    <label class="field-label">
      Bit Order
      <select v-model="store.bitOrder"><option value="msb">MSB First</option><option value="lsb">LSB First</option></select>
    </label>
    <button class="primary-btn wide" @click="store.process">ϟ Apply & Generate</button>
  </PanelSection>
</template>
