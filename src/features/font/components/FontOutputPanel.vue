<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="font-output" step="4" title="Generated Output">
    <template #actions><button class="ghost-primary">⧉ Copy</button><button class="ghost-primary">⇩ Download</button></template>
    <pre class="code-block">// Character: '汉' (U+6C49) | 32x32 | Horizontal LTR
const uint8_t font_han_6c49[128] = {
  0x00, 0x00, 0x03, 0xFC, 0x18, 0x03, 0x00, 0x00,
  0x00, 0x00, 0x07, 0xE0, 0x00, 0x03, 0x00, 0x00,
  0x00, 0x00, 0x0F, 0x80, 0x01, 0x83, 0x00, 0x00
};</pre>
    <aside class="hex-preview"><h3>Hex Preview</h3><div class="han-mini">汉</div><span>32 x 32 px</span></aside>
  </PanelSection>
</template>
