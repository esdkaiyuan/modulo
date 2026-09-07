<script setup lang="ts">
import { ref } from 'vue';
import { PRESET_CATEGORIES, getPresetsByCategory, type PresetItem } from '../presets';
import { t } from '../../../i18n';

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'close'): void;
}>();

const activeCategory = ref<string>('emoji');

const categoryLabels: Record<string, string> = {
  emoji: 'Emoji',
  symbol: 'Symbols',
  shape: 'Shapes'
};

function selectPreset(preset: PresetItem) {
  emit('select', preset.id);
}
</script>

<template>
  <div class="bead-preset-picker" @click.stop>
    <div class="bead-preset-tabs">
      <button
        v-for="cat in PRESET_CATEGORIES"
        :key="cat"
        class="btn sm"
        :class="{ toggled: activeCategory === cat }"
        @click="activeCategory = cat"
      >{{ categoryLabels[cat] || cat }}</button>
    </div>
    <div class="bead-preset-grid">
      <button
        v-for="preset in getPresetsByCategory(activeCategory)"
        :key="preset.id"
        class="bead-preset-item"
        :title="preset.label"
        @click="selectPreset(preset)"
      >
        <span class="bead-preset-char">{{ preset.char }}</span>
        <span class="bead-preset-label">{{ preset.label }}</span>
      </button>
    </div>
  </div>
</template>
