<script setup lang="ts">
import TopBar from '../features/handdraw/components/TopBar.vue';
import ToolPanel from '../features/handdraw/components/ToolPanel.vue';
import PixelCanvas from '../features/handdraw/components/PixelCanvas.vue';
import RightPanel from '../features/handdraw/components/RightPanel.vue';
import OutputPanel from '../features/handdraw/components/OutputPanel.vue';
</script>

<template>
  <div class="app-shell responsive-tool-page tool-ui-frame handdraw-page handdraw-reference-shell">
    <TopBar />
    <main class="workbench handdraw-reference-workbench">
      <ToolPanel />
      <section class="center-stage handdraw-canvas-stage">
        <PixelCanvas />
        <OutputPanel />
      </section>
      <RightPanel />
    </main>
  </div>
</template>
