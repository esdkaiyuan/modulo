<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useVideoModuloStore } from '../stores/videoModuloStore';

const store = useVideoModuloStore();

watch(
  () => [store.targetWidth, store.targetHeight, store.brightness, store.contrast, store.threshold, store.dithering, store.scanDirection, store.bitOrder, store.polarity, store.outputFps],
  () => store.processFrames()
);
</script>

<template>
  <aside class="video-settings">
    <PanelSection title="Extract Settings">
      <label class="field-label">Start Time<input v-model.number="store.startTime" type="number" min="0" step="0.1" /></label>
      <label class="field-label">End Time<input v-model.number="store.endTime" type="number" min="0" step="0.1" /></label>
      <label class="field-label">Sample Rate (FPS)<input v-model.number="store.sampleFps" type="number" min="1" max="60" /></label>
      <label class="field-label">Sample Every N frames<input v-model.number="store.sampleEveryNFrames" type="number" min="1" max="120" /></label>
      <button class="ghost-primary wide">◉ Preview Frame at Cursor</button>
    </PanelSection>
    <PanelSection title="Frame Settings">
      <label class="field-label">Target Width<input v-model.number="store.targetWidth" type="number" min="1" max="512" /></label>
      <label class="field-label">Target Height<input v-model.number="store.targetHeight" type="number" min="1" max="512" /></label>
      <label class="field-label">Threshold<input v-model.number="store.threshold" type="number" min="0" max="255" /></label>
      <label class="field-label">Brightness<input v-model.number="store.brightness" type="number" min="-100" max="100" /></label>
      <label class="field-label">Contrast<input v-model.number="store.contrast" type="number" min="0.2" max="3" step="0.05" /></label>
      <label class="field-label">Dithering<select v-model="store.dithering"><option value="none">None</option><option value="floyd-steinberg">Floyd-Steinberg</option></select></label>
    </PanelSection>
    <PanelSection title="Output Settings">
      <label class="field-label">Scanning Direction<select v-model="store.scanDirection"><option value="horizontal-ltr">Left to Right, Top to Bottom</option><option value="horizontal-rtl">Right to Left, Top to Bottom</option><option value="vertical-ttb">Top to Bottom, Left to Right</option><option value="vertical-btt">Bottom to Top, Left to Right</option></select></label>
      <label class="field-label">Encoding Mode<select v-model="store.polarity"><option value="positive">1 bit per pixel</option><option value="negative">Inverted</option></select></label>
      <label class="field-label">Bit Order<select v-model="store.bitOrder"><option value="msb">MSB First</option><option value="lsb">LSB First</option></select></label>
      <label class="field-label">Output FPS<input v-model.number="store.outputFps" type="number" min="1" max="60" /></label>
      <button class="primary-btn wide" @click="store.processFrames">♢ Generate All</button>
      <div class="stat-list"><span>Total Frames <b>{{ store.extractedFrames.length }}</b></span><span>Sampled Frames <b>{{ store.processedFrames.length }}</b></span><span>Estimated Size <b>{{ store.estimatedBytes }} B</b></span></div>
    </PanelSection>
  </aside>
</template>
