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
    store.scalingAlgorithm,
    store.scanDirection,
    store.bitOrder,
    store.polarity,
    store.colorMode
  ],
  () => {
    if (!store.fixedMode) {
      store.syncCropToTarget();
    }
    store.process();
  }
);
</script>

<template>
  <PanelSection class="image-options image-options-panel" step="3" title="Processing Options">
    <div class="mode-toggle">
      <button :class="{ active: store.colorMode === 'mono' }" @click="store.colorMode = 'mono'">◐ 常规取模</button>
      <button :class="{ active: store.colorMode === 'rgb565' }" @click="store.colorMode = 'rgb565'">◈ 彩色取模</button>
      <button :class="{ active: store.colorMode === 'palette16' }" @click="store.colorMode = 'palette16'">◉ 16色调色板</button>
    </div>
    <label class="field-label"><span>Color Mode</span><select v-model="store.colorMode"><option value="mono">Monochrome (1bpp)</option><option value="rgb565">RGB565 (16-bit)</option><option value="palette16">16-Color Palette (4bpp)</option></select></label>
    <label class="field-label slider-field"><strong>Brightness</strong><span>-100</span><input v-model.number="store.brightness" type="range" min="-100" max="100" /><span>+100</span><input v-model.number="store.brightness" type="number" min="-100" max="100" /></label>
    <label class="field-label slider-field"><strong>Contrast</strong><span>0</span><input v-model.number="store.contrast" type="range" min="0.2" max="3" step="0.05" /><span>200</span><input :value="Math.round(store.contrast * 100)" type="number" min="20" max="300" @input="updateContrastPercent" /></label>
    <label class="field-label slider-field"><strong>Threshold</strong><span>0</span><input v-model.number="store.threshold" type="range" min="0" max="255" /><span>255</span><button type="button">Auto OTSU</button></label>
    <label class="field-label"><span>Scaling Algorithm</span><select v-model="store.scalingAlgorithm"><option value="nearest">Nearest Neighbor</option><option value="bilinear">Bilinear (Smoother)</option></select></label>
    <label class="field-label"><span>Dithering</span><select v-model="store.dithering"><option value="floyd-steinberg">Floyd-Steinberg</option><option value="none">None</option></select></label>
    <label class="field-label"><span>Scan Direction</span><select v-model="store.scanDirection">
        <option value="horizontal-ltr">Left to Right, Top to Bottom</option>
        <option value="horizontal-rtl">Right to Left, Top to Bottom</option>
        <option value="vertical-ttb">Top to Bottom, Left to Right</option>
        <option value="vertical-btt">Bottom to Top, Left to Right</option>
      </select></label>
    <label class="field-label"><span>Encoding Mode</span><select v-model="store.polarity"><option value="positive">1 Bit Per Pixel (Monochrome)</option><option value="negative">Inverted Monochrome</option></select></label>
    <label class="field-label"><span>Bit Order</span><select v-model="store.bitOrder"><option value="msb">MSB First</option><option value="lsb">LSB First</option></select></label>
    <div class="resolution-row">
      <label class="field-label"><span>Resolution W</span><input v-model.number="store.targetWidth" type="number" min="1" max="512" /></label>
      <label class="field-label"><span>Resolution H</span><input v-model.number="store.targetHeight" type="number" min="1" max="512" /></label>
    </div>
    <label class="field-label slider-field crop-width-field"><strong>Crop Width</strong><span>0</span><input v-model.number="store.cropW" type="range" :min="store.targetWidth" :max="store.sourceWidth || 4096" /><span>{{ store.sourceWidth || 'Max' }}</span><input v-model.number="store.cropW" type="number" :min="store.targetWidth" :max="store.sourceWidth || 4096" /></label>
    <label class="field-label slider-field crop-height-field"><strong>Crop Height</strong><span>0</span><input v-model.number="store.cropH" type="range" :min="store.targetHeight" :max="store.sourceHeight || 4096" /><span>{{ store.sourceHeight || 'Max' }}</span><input v-model.number="store.cropH" type="number" :min="store.targetHeight" :max="store.sourceHeight || 4096" /></label>
    <button class="primary-btn wide" @click="store.process">ϟ Apply & Generate</button>
  </PanelSection>
</template>
