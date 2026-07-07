<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="video-output" title="Generated Output (C Array - Hex)">
    <template #actions><button class="ghost-btn">⧉ Copy</button><button class="ghost-btn">⇩ Download</button></template>
    <pre class="code-block">// Video: sample_video_1080p.mp4
const uint8_t video_frames[86][1024] PROGMEM = {
  // Frame 0 - Time: 00:00:00.000
  { 0x00, 0x00, 0x00, 0x18, 0x3C, 0x7E, ... },
  // Frame 85
  { 0x00, 0x18, 0x3C, 0x7E, 0xFF, 0xBD, ... }
};</pre>
    <div class="black-player small landscape"></div>
  </PanelSection>
</template>
