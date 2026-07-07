<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';

const options = ['Brightness', 'Contrast', 'Threshold', 'Scaling Algorithm', 'Dithering', 'Scan Direction', 'Encoding Mode', 'Byte Order', 'Output Format'];
</script>

<template>
  <PanelSection class="image-options" step="3" title="Processing Options">
    <label v-for="option in options" :key="option" class="field-label">
      {{ option }}
      <input v-if="['Brightness','Contrast','Threshold'].includes(option)" type="range" value="55" />
      <select v-else><option>{{ option === 'Dithering' ? 'Floyd-Steinberg' : 'Nearest Neighbor' }}</option></select>
    </label>
    <button class="primary-btn wide">ϟ Apply & Generate</button>
  </PanelSection>
</template>
