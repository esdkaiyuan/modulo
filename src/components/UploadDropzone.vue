<template>
  <div class="upload-dropzone" @click="$emit('select')" @dragover.prevent @drop.prevent="$emit('drop', $event)">
    <slot name="input" />
    <div class="upload-dropzone-content">
      <slot name="icon" />
      <p>{{ title }}</p>
      <p v-if="hint" class="upload-hint">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  hint: {
    type: String,
    default: '',
  },
})

defineEmits(['select', 'drop'])
</script>
