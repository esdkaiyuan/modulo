<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="image-output" step="4" title="Generated C Array">
    <template #actions><button class="ghost-btn">⧉ Copy</button><button class="ghost-btn">⇩ Download</button></template>
    <pre class="code-block">// Image: panda_128x64.png
// Resolution: 128x64, 1bpp, MSB First
const uint8_t panda_128x64[] PROGMEM = {
  0x00, 0x00, 0x00, 0x00, 0x18, 0x3C, 0x7E, 0xFF,
  // ... (120 more lines)
};</pre>
    <aside class="output-preview"><h2><span class="step-badge">5</span> Output Preview</h2><div class="dot-preview panda-dots"></div><footer>Scale: 4x <span>Grid: On</span></footer></aside>
  </PanelSection>
</template>
