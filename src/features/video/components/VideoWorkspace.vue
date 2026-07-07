<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { frameThumbs } from '../../shared/mock';
</script>

<template>
  <section class="video-workspace">
    <div class="hero-video landscape"></div>
    <PanelSection title="Current Frame (Source)"><div class="pixel-art video-source"></div></PanelSection>
    <PanelSection title="Extracted Frame (Dot Matrix Preview)"><div class="dot-preview landscape"></div></PanelSection>
    <PanelSection title="Sampled Frames (Every 3 frames at 10 fps)">
      <div class="frame-strip compact"><button>‹</button><div v-for="thumb in frameThumbs.slice(0, 7)" :key="thumb.frame" class="video-thumb"><span></span><small>00:12:{{ thumb.frame }}.000<br />#{{ thumb.frame + 360 }}</small></div><button>›</button></div>
    </PanelSection>
  </section>
</template>
