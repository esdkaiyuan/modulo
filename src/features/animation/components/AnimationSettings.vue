<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <aside class="media-settings">
    <PanelSection title="Frame Settings">
      <div class="setting-grid"><label>Start Frame<input value="1" /></label><label>End Frame<input value="48" /></label></div>
      <label class="field-label">Sampling Rate<select><option>1 frame per step</option></select></label>
      <label class="field-label">Frame Delay<select><option>Preserve original delays</option></select></label>
      <label class="field-label">Target Size<input value="64 x 64 px" /></label>
      <button class="primary-btn wide">▷ Preview All Frames</button>
    </PanelSection>
    <PanelSection title="Output Settings">
      <label v-for="item in ['Scanning Direction','Encoding Mode','Byte Order','Output Format']" :key="item" class="field-label">{{ item }}<select><option>Left → Right Top → Bottom</option></select></label>
      <button class="primary-btn wide">⌘ Generate Frame Data</button>
    </PanelSection>
  </aside>
</template>
