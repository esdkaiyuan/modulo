<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useAnimationModuloStore } from '../stores/animationModuloStore';

const store = useAnimationModuloStore();

watch(
  () => [store.startFrame, store.endFrame, store.sampleStep, store.targetWidth, store.targetHeight, store.threshold, store.dithering, store.scanDirection, store.bitOrder, store.polarity],
  () => store.processFrames()
);
</script>

<template>
  <aside class="media-settings">
    <PanelSection title="Frame Settings">
      <div class="setting-grid"><label>Start Frame<input v-model.number="store.startFrame" type="number" min="1" /></label><label>End Frame<input v-model.number="store.endFrame" type="number" min="1" /></label></div>
      <label class="field-label">Sampling Rate<select v-model.number="store.sampleStep"><option :value="1">1 frame per step</option><option :value="2">2 frames per step</option><option :value="3">3 frames per step</option><option :value="5">5 frames per step</option></select></label>
      <label class="field-label">Threshold<input v-model.number="store.threshold" type="number" min="0" max="255" /></label>
      <label class="field-label">Target Width<input v-model.number="store.targetWidth" type="number" min="1" max="256" /></label>
      <label class="field-label">Target Height<input v-model.number="store.targetHeight" type="number" min="1" max="256" /></label>
      <label class="field-label">Dithering<select v-model="store.dithering"><option value="none">None</option><option value="floyd-steinberg">Floyd-Steinberg</option></select></label>
      <button class="primary-btn wide" @click="store.processFrames">▷ Preview All Frames</button>
    </PanelSection>
    <PanelSection title="Output Settings">
      <label class="field-label">Scanning Direction<select v-model="store.scanDirection"><option value="horizontal-ltr">Left → Right Top → Bottom</option><option value="horizontal-rtl">Right → Left Top → Bottom</option><option value="vertical-ttb">Top → Bottom Left → Right</option><option value="vertical-btt">Bottom → Top Left → Right</option></select></label>
      <label class="field-label">Encoding Mode<select v-model="store.polarity"><option value="positive">1 bit per pixel</option><option value="negative">Inverted 1 bit per pixel</option></select></label>
      <label class="field-label">Bit Order<select v-model="store.bitOrder"><option value="msb">MSB First</option><option value="lsb">LSB First</option></select></label>
      <label class="field-label">Output Format<select><option>C Array (uint8_t)</option></select></label>
      <button class="primary-btn wide" @click="store.processFrames">⌘ Generate Frame Data</button>
    </PanelSection>
  </aside>
</template>
