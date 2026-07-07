<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <aside class="video-settings">
    <PanelSection title="Extract Settings">
      <label v-for="field in ['Start Time','End Time','Sample Rate (FPS)','Sample Every N frames']" :key="field" class="field-label">{{ field }}<input :value="field.includes('End') ? '00:45:22.000' : field.includes('Sample') ? '10 fps' : '00:00:00.000'" /></label>
      <button class="ghost-primary wide">◉ Preview Frame at Cursor</button>
    </PanelSection>
    <PanelSection title="Frame Settings">
      <label v-for="field in ['Target Width','Target Height','Threshold','Brightness','Contrast','Scaling Algorithm']" :key="field" class="field-label">{{ field }}<input :value="field.includes('Width') ? 128 : field.includes('Height') ? 64 : 0" /></label>
    </PanelSection>
    <PanelSection title="Output Settings">
      <label v-for="field in ['Scanning Direction','Encoding Mode','Bit Order','Output Format']" :key="field" class="field-label">{{ field }}<select><option>MSB First</option></select></label>
      <button class="primary-btn wide">♢ Generate All</button>
      <div class="stat-list"><span>Total Frames <b>1247</b></span><span>Sampled Frames <b>86</b></span><span>Estimated Size <b>4.2 KB</b></span></div>
    </PanelSection>
  </aside>
</template>
