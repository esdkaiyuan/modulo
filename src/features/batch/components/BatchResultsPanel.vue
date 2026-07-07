<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { outputLines } from '../../shared/mock';
</script>

<template>
  <PanelSection class="batch-results" step="4" title="Output & Results">
    <template #actions>
      <select><option>image_023.png (Done)</option></select>
      <button class="ghost-btn">▣ Open Output Folder</button>
    </template>
    <div class="result-layout">
      <div class="pixel-art landscape"></div>
      <pre class="code-block">{{ outputLines.join('\n') }}</pre>
      <div class="export-stack">
        <h3>Export All Results</h3>
        <button>▧ Merge into One File</button>
        <button>□ Separate Files per Input</button>
        <button>▤ Generate Report (CSV)</button>
      </div>
    </div>
  </PanelSection>
</template>
