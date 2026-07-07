<template>
  <div class="status-summary">
    <div v-for="item in items" :key="item.label" class="status-summary-item">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>
