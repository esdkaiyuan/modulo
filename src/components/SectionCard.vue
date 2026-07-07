<template>
  <section class="section-card">
    <div class="section-card-header">
      <div class="section-card-title-group">
        <h2>{{ title }}</h2>
        <p v-if="description" class="section-card-desc">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="section-card-actions">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>
