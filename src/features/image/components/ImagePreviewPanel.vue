<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="image-preview" step="2" title="Original Image (with crop)">
    <template #actions><span>Sync Preview</span><span class="toggle-on"></span><strong>Preview (Dot Matrix)</strong></template>
    <div class="compare-grid">
      <div class="panda crop-box"></div>
      <div class="dot-preview panda-dots"></div>
    </div>
  </PanelSection>
</template>
