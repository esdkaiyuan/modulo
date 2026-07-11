<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useVideoModuloStore } from '../stores/videoModuloStore';

const store = useVideoModuloStore();

watch(
  () => [store.targetWidth, store.targetHeight, store.brightness, store.contrast, store.threshold, store.dithering, store.scanDirection, store.bitOrder, store.polarity, store.outputFps, store.mode, store.exportFormat, store.rgb565ByteOrder, store.rgb888Order, store.transparentBackground],
  () => store.processFrames()
);
</script>

<template>
  <aside class="video-settings">
    <PanelSection title="Extract Settings">
      <h3>Time Range</h3>
      <label class="field-label">Start Time<input v-model.number="store.startTime" type="number" min="0" step="0.1" /></label>
      <label class="field-label">End Time<input v-model.number="store.endTime" type="number" min="0" step="0.1" /></label>
      <h3>Sampling</h3>
      <label class="field-label">Sample Rate (FPS)<select v-model.number="store.sampleFps"><option :value="10">10 fps</option><option :value="15">15 fps</option><option :value="30">30 fps</option></select></label>
      <label class="field-label">Sample Every N frames<input v-model.number="store.sampleEveryNFrames" type="number" min="1" max="120" /></label>
      <label class="toggle-field">Extract Keyframes Only <input type="checkbox" /><i></i></label>
      <button class="ghost-primary wide">◉ Preview Frame at Cursor</button>
    </PanelSection>
    <PanelSection title="Frame Settings">
      <label class="field-label">Target Width<input v-model.number="store.targetWidth" type="number" min="1" max="512" /></label>
      <label class="field-label">Target Height<input v-model.number="store.targetHeight" type="number" min="1" max="512" /></label>
      <label class="field-label">Threshold<input v-model.number="store.threshold" type="number" min="0" max="255" /></label>
      <label class="field-label">Brightness<input v-model.number="store.brightness" type="number" min="-100" max="100" /></label>
      <label class="field-label">Contrast<input v-model.number="store.contrast" type="number" min="0.2" max="3" step="0.05" /></label>
      <label class="field-label">Scaling Algorithm<select v-model="store.dithering"><option value="none">Nearest Neighbor</option><option value="floyd-steinberg">Floyd-Steinberg</option></select></label>
    </PanelSection>
    <PanelSection title="Output Settings">
      <div class="field-label" data-test="video-mode"><strong>Modulo Mode</strong><div class="segmented-control"><button type="button" :class="{ active: store.mode === 'mono' }" @click="store.mode = 'mono'">Mono</button><button type="button" :class="{ active: store.mode !== 'mono' }" @click="store.mode = 'rgb565'">Color</button></div></div>
      <label v-if="store.mode !== 'mono'" class="field-label">Color Encoding<select v-model="store.mode" data-test="video-color-encoding"><option value="rgb565">RGB565</option><option value="rgb888">RGB888</option><option value="palette16">16-color Palette</option></select></label>
      <label class="field-label">Scanning Direction<select v-model="store.scanDirection"><option value="horizontal-ltr">Left to Right, Top to Bottom</option><option value="horizontal-rtl">Right to Left, Top to Bottom</option><option value="vertical-ttb">Top to Bottom, Left to Right</option><option value="vertical-btt">Bottom to Top, Left to Right</option></select></label>
      <label v-if="store.mode === 'mono'" class="field-label">Encoding Mode<select v-model="store.polarity"><option value="positive">1 bit per pixel</option><option value="negative">Inverted</option></select></label>
      <label v-if="store.mode === 'mono'" class="field-label">Bit Order<select v-model="store.bitOrder"><option value="msb">MSB First</option><option value="lsb">LSB First</option></select></label>
      <label v-if="store.mode === 'rgb565'" class="field-label">Byte Order<select v-model="store.rgb565ByteOrder"><option value="msb-first">High Byte First</option><option value="lsb-first">Low Byte First</option></select></label>
      <label v-if="store.mode === 'rgb888'" class="field-label">Channel Order<select v-model="store.rgb888Order"><option value="rgb">RGB</option><option value="bgr">BGR</option></select></label>
      <label v-if="store.mode !== 'mono'" class="field-label">Transparent Pixel Color<input v-model="store.transparentBackground" type="color" /></label>
      <label class="field-label">Output Format<select v-model="store.exportFormat" data-test="video-export-format"><option value="c-array">C Array</option><option value="hex">HEX Text</option><option value="bin">BIN Binary</option></select></label>
      <button class="primary-btn wide" @click="store.processFrames">♢ Generate All</button>
      <div class="stat-list"><h3>Extraction Stats</h3><span>Total Frames <b>{{ store.extractedFrames.length || 1247 }}</b></span><span>Sampled Frames <b>{{ store.processedFrames.length || 86 }}</b></span><span>Extracted Frames <b>{{ store.processedFrames.length || 86 }}</b></span><span>Estimated Size <b>{{ store.estimatedBytes || '4.2 KB' }}</b></span></div>
    </PanelSection>
  </aside>
</template>
