<script setup lang="ts">
import ImageHeader from '../features/image/components/ImageHeader.vue';
import ImageImportPanel from '../features/image/components/ImageImportPanel.vue';
import ImagePreviewPanel from '../features/image/components/ImagePreviewPanel.vue';
import ImageOptionsPanel from '../features/image/components/ImageOptionsPanel.vue';
import ImageOutputPanel from '../features/image/components/ImageOutputPanel.vue';
</script>

<template>
  <div class="dm-page image-page image-reference-shell responsive-tool-page tool-ui-frame">
    <ImageHeader />
    <main class="image-reference-grid">
      <div class="image-main-stack">
        <div class="image-import-row">
          <ImageImportPanel />
        </div>
        <div class="image-preview-row">
          <ImagePreviewPanel />
        </div>
      </div>
      <ImageOptionsPanel />
      <ImageOutputPanel />
    </main>
  </div>
</template>
