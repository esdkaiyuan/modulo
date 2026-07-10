<script setup lang="ts">
import FontHeader from '../features/font/components/FontHeader.vue';
import FontInputPanel from '../features/font/components/FontInputPanel.vue';
import FontPreviewPanel from '../features/font/components/FontPreviewPanel.vue';
import FontOptionsPanel from '../features/font/components/FontOptionsPanel.vue';
import FontOutputPanel from '../features/font/components/FontOutputPanel.vue';
</script>

<template>
  <div class="dm-page font-page font-reference-shell responsive-tool-page tool-ui-frame">
    <FontHeader />
    <main class="font-grid">
      <FontInputPanel />
      <div class="font-main-row">
        <FontPreviewPanel />
        <FontOptionsPanel />
      </div>
      <div class="font-output-row">
        <FontOutputPanel />
      </div>
    </main>
  </div>
</template>
