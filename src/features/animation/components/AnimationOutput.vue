<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="media-output" title="Generated Code">
    <template #actions><button class="ghost-btn">⧉ Copy Code</button><button class="ghost-btn">⇩ Download .h</button></template>
    <pre class="code-block">// Frame data (48 frames, 64x64, 1bpp)
const uint8_t anim_frames[48][512] PROGMEM = {
  // Frame 0
  { 0x00, 0x00, 0x00, 0x00, ... },
  // Frame 47
  { 0x00, 0x18, 0x3C, 0x7E, ... }
};</pre>
    <div class="black-player small runner"></div>
  </PanelSection>
</template>
