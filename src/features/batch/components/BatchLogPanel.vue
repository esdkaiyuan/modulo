<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { useBatchModuloStore } from '../stores/batchModuloStore';

const store = useBatchModuloStore();
</script>

<template>
  <PanelSection class="batch-log" step="2" title="Processing Log">
    <template #actions>
      <button class="ghost-btn">Ⅱ Pause</button>
      <span>Overall Progress</span>
      <span class="progress wide-progress"><i :style="{ width: `${store.overallProgress}%` }"></i></span>
      <strong>{{ store.overallProgress }}%</strong>
      <span>{{ store.summary.processing ? 'Processing' : 'Idle' }}</span>
    </template>
    <pre class="terminal-log">{{ store.logs.length ? store.logs.join('\n') : 'No batch activity yet.' }}</pre>
  </PanelSection>
</template>
