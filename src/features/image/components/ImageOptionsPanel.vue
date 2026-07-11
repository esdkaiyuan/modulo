<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useImageModuloStore } from '../stores/imageModuloStore';

const store = useImageModuloStore();

function updateContrastPercent(event: Event) {
  const input = event.target as HTMLInputElement;
  store.contrast = Number(input.value) / 100;
}

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
    ,store.mode,
    store.exportFormat,
    store.rgb565ByteOrder,
    store.rgb888Order,
    store.transparentBackground,
    store.cropX,
    store.cropY,
    store.cropWidth,
    store.cropHeight
  ],
  () => store.process()
);
</script>

<template>
  <PanelSection class="image-options image-options-panel" step="3" title="Processing Options">
    <div class="field-label" data-test="image-mode">
      <strong>Modulo Mode</strong>
      <div class="segmented-control">
        <button type="button" :class="{ active: store.mode === 'mono' }" @click="store.mode = 'mono'">Mono</button>
        <button type="button" :class="{ active: store.mode !== 'mono' }" @click="store.mode = 'rgb565'">Color</button>
      </div>
    </div>
    <label v-if="store.mode !== 'mono'" class="field-label">
      Color Encoding
      <select v-model="store.mode" data-test="image-color-encoding">
        <option value="rgb565">RGB565</option><option value="rgb888">RGB888</option><option value="palette16">16-color Palette</option>
      </select>
    </label>
    <label class="field-label slider-field"><strong>Brightness</strong><span>-100</span><input v-model.number="store.brightness" type="range" min="-100" max="100" /><span>+100</span><input v-model.number="store.brightness" type="number" min="-100" max="100" /></label>
    <label class="field-label slider-field"><strong>Contrast</strong><span>0</span><input v-model.number="store.contrast" type="range" min="0.2" max="3" step="0.05" /><span>200</span><input :value="Math.round(store.contrast * 100)" type="number" min="20" max="300" @input="updateContrastPercent" /></label>
    <label v-if="store.mode === 'mono'" class="field-label slider-field"><strong>Threshold</strong><span>0</span><input v-model.number="store.threshold" type="range" min="0" max="255" /><span>255</span><button type="button">Auto OTSU</button></label>
    <label v-if="store.mode === 'mono'" class="field-label">
      Scaling Algorithm
      <select v-model="store.scalingAlgorithm"><option value="nearest">Nearest Neighbor</option></select>
    </label>
    <label v-if="store.mode === 'mono'" class="field-label">
      Dithering
      <select v-model="store.dithering"><option value="floyd-steinberg">Floyd-Steinberg</option><option value="none">None</option></select>
    </label>
    <label v-if="store.mode === 'mono'" class="field-label">
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
    <label v-if="store.mode === 'rgb565'" class="field-label">Byte Order<select v-model="store.rgb565ByteOrder" data-test="image-rgb565-order"><option value="msb-first">High Byte First</option><option value="lsb-first">Low Byte First</option></select></label>
    <label v-if="store.mode === 'rgb888'" class="field-label">Channel Order<select v-model="store.rgb888Order" data-test="image-rgb888-order"><option value="rgb">RGB</option><option value="bgr">BGR</option></select></label>
    <label v-if="store.mode !== 'mono'" class="field-label">Transparent Pixel Color<input v-model="store.transparentBackground" type="color" /></label>
    <label class="field-label">Output Format<select v-model="store.exportFormat" data-test="image-export-format"><option value="c-array">C Array</option><option value="hex">HEX Text</option><option value="bin">BIN Binary</option></select></label>
    <button class="primary-btn wide" @click="store.process">ϟ Apply & Generate</button>
  </PanelSection>
</template>
