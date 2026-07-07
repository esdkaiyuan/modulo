<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';

const options = ['Scanning Direction', 'Encoding Mode', 'Byte Order', 'Bit Order (in Byte)', 'Output Format'];
</script>

<template>
  <PanelSection class="font-options" step="3" title="Encoding Options">
    <label v-for="option in options" :key="option" class="option-line">
      <span>☷</span>
      {{ option }}
      <select><option>{{ option === 'Output Format' ? 'C Array (uint8_t[])' : 'Horizontal LTR (Left → Right, Top → Bottom)' }}</option></select>
    </label>
    <button class="ghost-primary wide">⟳ Regenerate</button>
  </PanelSection>
</template>
