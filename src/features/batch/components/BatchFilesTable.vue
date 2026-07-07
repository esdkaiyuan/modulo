<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';

const files = [
  ['image_023.png', 'Done', '100%', '12.45 KB'],
  ['image_024.png', 'Processing', '62%', '18.72 KB'],
  ['image_025.png', 'Pending', '0%', '7.91 KB'],
  ['image_026.png', 'Error', '15%', '22.18 KB'],
  ['image_027.png', 'Done', '100%', '9.33 KB'],
  ['image_028.png', 'Pending', '0%', '11.02 KB'],
  ['image_029.png', 'Pending', '0%', '15.66 KB']
];
</script>

<template>
  <PanelSection class="batch-files" step="1" title="Input Files">
    <template #actions>
      <label class="inline-check"><input type="checkbox" /> Select All (47)</label>
      <button class="primary-btn">▶ Start Batch</button>
    </template>
    <table class="file-table">
      <thead>
        <tr>
          <th><input type="checkbox" /></th>
          <th>File Name</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Size</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(file, index) in files" :key="file[0]">
          <td><input type="checkbox" /></td>
          <td><span class="mini-image" :class="`tone-${index % 4}`"></span>{{ file[0] }}</td>
          <td><span class="status-pill" :class="file[1].toLowerCase()">{{ file[1] }}</span></td>
          <td><span class="progress"><i :style="{ width: file[2] }"></i></span>{{ file[2] }}</td>
          <td>{{ file[3] }}</td>
          <td><button class="link-danger">Remove</button></td>
        </tr>
      </tbody>
    </table>
    <footer class="table-footer">Showing 1 to 20 of 47 files <span>‹ 1 2 3 ... ›</span></footer>
  </PanelSection>
</template>
