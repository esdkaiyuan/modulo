<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="batch-log" step="2" title="Processing Log">
    <template #actions>
      <button class="ghost-btn">Ⅱ Pause</button>
      <span>Overall Progress</span>
      <span class="progress wide-progress"><i style="width: 48%"></i></span>
      <strong>48%</strong>
      <span>ETA: 00:04:32</span>
    </template>
    <pre class="terminal-log">[12:34:56] ▣ Queued 47 files for processing
[12:34:56] ▣ Processing image_021.png... ✓ Done (0.42s)
[12:34:57] ▣ Processing image_024.png... ⇆ Processing (62%)
[12:34:58] ▣ Processing image_026.png... ✕ Error: Checksum mismatch at line 128
[12:34:59] ▣ Processing image_028.png... ⧖ Pending</pre>
  </PanelSection>
</template>
