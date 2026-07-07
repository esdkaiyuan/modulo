<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { frameThumbs } from '../../shared/mock';
</script>

<template>
  <section class="media-workspace">
    <PanelSection title="Source Animation">
      <template #actions><span class="tag green">GIF</span><span class="tag blue">WebP</span><span class="tag purple">APNG</span><strong>64 x 64 px</strong></template>
      <div class="black-player runner"></div>
      <div class="media-controls"><button>▶</button><button>Ⅱ</button><button>■</button><span>Frame: <strong>12 / 48</strong></span><input type="range" value="45" /><span>200 ms</span></div>
    </PanelSection>
    <PanelSection title="Extracted Frames">
      <div class="frame-strip">
        <button>‹</button>
        <div v-for="thumb in frameThumbs" :key="thumb.frame" class="frame-thumb" :class="{ active: thumb.frame === 12 }"><span></span><strong>{{ thumb.frame }}</strong><small>{{ thumb.delay }}</small></div>
        <button>›</button>
      </div>
    </PanelSection>
    <PanelSection title="Zoom">
      <div class="zoom-matrix runner"></div>
    </PanelSection>
  </section>
</template>
