<script setup lang="ts">
import ImageHeader from '../features/image/components/ImageHeader.vue';
import ImageImportPanel from '../features/image/components/ImageImportPanel.vue';
import ImagePreviewPanel from '../features/image/components/ImagePreviewPanel.vue';
import ImageOptionsPanel from '../features/image/components/ImageOptionsPanel.vue';
import ImageOutputPanel from '../features/image/components/ImageOutputPanel.vue';
</script>

<template>
  <div class="dm-page image-page">
    <ImageHeader />
    <main class="image-grid">
      <ImageImportPanel />
      <ImagePreviewPanel />
      <ImageOptionsPanel />
      <ImageOutputPanel />
    </main>
  </div>
</template>
