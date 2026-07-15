<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <section class="panel">
    <header v-if="title || $slots.actions" class="panel-head">
      <h3 v-if="title" class="panel-title">{{ title }}</h3>
      <div v-if="$slots.actions" class="panel-actions"><slot name="actions" /></div>
    </header>
    <div class="panel-body" :class="{ tight: $slots.actions && !title }">
      <slot />
    </div>
  </section>
</template>
