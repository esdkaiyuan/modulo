<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="image-import" step="1" title="Import Image">
    <div class="drop-zone">
      <strong>☁ Drop image here or click to browse</strong>
      <span><b>PNG</b><b>JPG</b><b>BMP</b><b>WEBP</b></span>
    </div>
    <div class="image-actions"><button class="ghost-primary">⌗ Crop</button><button class="ghost-btn">↺ Reset</button></div>
    <div class="loaded-image panda"></div>
    <div class="image-meta"><strong>panda_128x64.png</strong><span>Dimensions: 128 × 64 px</span><span>File Size: 2.71 KB</span><span class="ok">✓ Image loaded</span></div>
  </PanelSection>
</template>
