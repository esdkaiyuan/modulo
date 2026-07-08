<script setup lang="ts">
import VideoHeader from '../features/video/components/VideoHeader.vue';
import VideoWorkspace from '../features/video/components/VideoWorkspace.vue';
import VideoSettings from '../features/video/components/VideoSettings.vue';
import VideoOutput from '../features/video/components/VideoOutput.vue';
</script>

<template>
  <div class="dm-page video-page responsive-tool-page">
    <VideoHeader />
    <main class="video-grid">
      <VideoWorkspace />
      <VideoSettings />
      <VideoOutput />
    </main>
  </div>
</template>
