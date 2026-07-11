<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useAnimationModuloStore } from '../stores/animationModuloStore';

const store = useAnimationModuloStore();

watch(
  () => [store.startFrame, store.endFrame, store.sampleStep, store.targetWidth, store.targetHeight, store.threshold, store.dithering, store.scanDirection, store.bitOrder, store.polarity, store.mode, store.exportFormat, store.rgb565ByteOrder, store.rgb888Order, store.transparentBackground],
  () => store.processFrames()
);
</script>

<template>
  <aside class="media-settings">
    <PanelSection class="animation-frame-settings" title="Frame Settings">
      <div class="setting-grid">
        <label>Start Frame<input v-model.number="store.startFrame" type="number" min="1" /></label>
        <label>End Frame<input v-model.number="store.endFrame" type="number" min="1" /></label>
      </div>
      <p class="settings-note">Total: {{ store.processedFrames.length || 48 }} frames</p>
      <label class="field-label">Sampling Rate
        <select v-model.number="store.sampleStep">
          <option :value="1">1 frame per step</option>
          <option :value="2">2 frames per step</option>
          <option :value="3">3 frames per step</option>
          <option :value="5">5 frames per step</option>
          <option :value="10">10 frames per step</option>
        </select>
      </label>
      <div class="animation-delay-box">
        <strong>Frame Delay</strong>
        <label><input type="radio" checked /> Preserve original delays</label>
        <label><input type="radio" /> Custom delay (ms)<input class="mini-input" type="number" value="200" /> ms</label>
      </div>
      <div class="target-size-grid">
        <label>Width<input v-model.number="store.targetWidth" type="number" min="1" max="256" /></label>
        <span>↔</span>
        <label>Height<input v-model.number="store.targetHeight" type="number" min="1" max="256" /></label>
      </div>
      <label class="inline-check"><input type="checkbox" checked /> Lock aspect ratio</label>
      <label class="field-label">Dithering
        <select v-model="store.dithering">
          <option value="none">None</option>
          <option value="floyd-steinberg">Floyd-Steinberg</option>
        </select>
      </label>
      <button class="primary-btn wide" @click="store.processFrames">▷ Preview All Frames</button>
      <p class="settings-note center">Plays all frames in sequence</p>
    </PanelSection>

    <PanelSection class="animation-output-settings" title="Output Settings">
      <div class="field-label" data-test="animation-mode"><strong>Modulo Mode</strong><div class="segmented-control"><button type="button" :class="{ active: store.mode === 'mono' }" @click="store.mode = 'mono'">Mono</button><button type="button" :class="{ active: store.mode !== 'mono' }" @click="store.mode = 'rgb565'">Color</button></div></div>
      <label v-if="store.mode !== 'mono'" class="field-label">Color Encoding<select v-model="store.mode" data-test="animation-color-encoding"><option value="rgb565">RGB565</option><option value="rgb888">RGB888</option><option value="palette16">16-color Palette</option></select></label>
      <div class="scan-grid">
        <label><input v-model="store.scanDirection" type="radio" value="horizontal-ltr" /><span></span><strong>Left → Right<br />Top → Bottom</strong></label>
        <label><input v-model="store.scanDirection" type="radio" value="horizontal-rtl" /><span></span><strong>Right → Left<br />Top → Bottom</strong></label>
        <label><input v-model="store.scanDirection" type="radio" value="vertical-ttb" /><span></span><strong>Left → Right<br />Bottom → Top</strong></label>
        <label><input v-model="store.scanDirection" type="radio" value="vertical-btt" /><span></span><strong>Right → Left<br />Bottom → Top</strong></label>
      </div>
      <label v-if="store.mode === 'mono'" class="field-label">Encoding Mode
        <select v-model="store.polarity">
          <option value="positive">1 bit per pixel</option>
          <option value="negative">Inverted 1 bit per pixel</option>
        </select>
      </label>
      <label v-if="store.mode === 'mono'" class="field-label">Bit Order
        <select v-model="store.bitOrder">
          <option value="msb">MSB First</option>
          <option value="lsb">LSB First</option>
        </select>
      </label>
      <label v-if="store.mode === 'rgb565'" class="field-label">Byte Order<select v-model="store.rgb565ByteOrder"><option value="msb-first">High Byte First</option><option value="lsb-first">Low Byte First</option></select></label>
      <label v-if="store.mode === 'rgb888'" class="field-label">Channel Order<select v-model="store.rgb888Order"><option value="rgb">RGB</option><option value="bgr">BGR</option></select></label>
      <label v-if="store.mode !== 'mono'" class="field-label">Transparent Pixel Color<input v-model="store.transparentBackground" type="color" /></label>
      <label class="field-label">Output Format<select v-model="store.exportFormat" data-test="animation-export-format"><option value="c-array">C Array</option><option value="hex">HEX Text</option><option value="bin">BIN Binary</option></select></label>
      <button class="primary-btn wide" @click="store.processFrames">⌘ Generate Frame Data</button>
      <p class="settings-note center">Generates code and preview</p>
    </PanelSection>
  </aside>
</template>
