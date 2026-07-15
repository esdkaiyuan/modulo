<script setup lang="ts">
defineProps<{
  step?: string;
  title: string;
}>();
</script>

<template>
  <section class="dm-card">
    <header class="dm-card-title">
      <span v-if="step" class="step-badge">{{ step }}</span>
      <h2>{{ title }}</h2>
      <slot name="actions" />
    </header>
    <div class="dm-card-body">
      <slot />
    </div>
  </section>
</template>
