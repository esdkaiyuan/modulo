<script setup lang="ts">
import BatchHeader from '../features/batch/components/BatchHeader.vue';
import BatchFilesTable from '../features/batch/components/BatchFilesTable.vue';
import BatchConfigPanel from '../features/batch/components/BatchConfigPanel.vue';
import BatchLogPanel from '../features/batch/components/BatchLogPanel.vue';
import BatchResultsPanel from '../features/batch/components/BatchResultsPanel.vue';
</script>

<template>
  <div class="dm-page batch-page">
    <BatchHeader />
    <main class="batch-grid">
      <BatchFilesTable />
      <BatchConfigPanel />
      <BatchLogPanel />
      <BatchResultsPanel />
    </main>
  </div>
</template>
