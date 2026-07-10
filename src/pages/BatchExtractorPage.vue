<script setup lang="ts">
import BatchHeader from '../features/batch/components/BatchHeader.vue';
import BatchFilesTable from '../features/batch/components/BatchFilesTable.vue';
import BatchConfigPanel from '../features/batch/components/BatchConfigPanel.vue';
import BatchLogPanel from '../features/batch/components/BatchLogPanel.vue';
import BatchResultsPanel from '../features/batch/components/BatchResultsPanel.vue';
</script>

<template>
  <div class="dm-page batch-page batch-reference-shell responsive-tool-page tool-ui-frame">
    <BatchHeader />
    <main class="batch-grid">
      <div class="batch-main-row">
        <div class="batch-left-stack">
          <BatchFilesTable />
          <BatchLogPanel />
          <BatchResultsPanel />
        </div>
        <BatchConfigPanel />
      </div>
    </main>
  </div>
</template>
