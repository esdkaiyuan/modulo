<template>
  <div class="config-item">
    <label>常用预设</label>
    <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value); $emit('select', $event.target.value)">
      <option
        v-for="preset in presets"
        :key="preset.id"
        :value="preset.id"
      >
        {{ preset.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  presets: {
    type: Array,
    required: true,
  },
})

defineEmits(['update:modelValue', 'select'])
</script>

