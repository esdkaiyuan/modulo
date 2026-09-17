<script setup lang="ts">
import { ref } from 'vue';
import { PRESET_CATEGORIES, getPresetsByCategory, type PresetItem } from '../presets';
import { t } from '../../../i18n';
import type { MessageKey } from '../../../i18n/messages';

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'close'): void;
}>();

const activeCategory = ref<string>('emoji');

const categoryLabels: Record<string, MessageKey> = {
  emoji: 'bead.presetCat.emoji',
  symbol: 'bead.presetCat.symbol',
  shape: 'bead.presetCat.shape'
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
      >{{ categoryLabels[cat] ? t(categoryLabels[cat]) : cat }}</button>
    </div>
    <div class="bead-preset-grid">
      <button
        v-for="preset in getPresetsByCategory(activeCategory)"
        :key="preset.id"
        class="bead-preset-item"
        :title="t(preset.labelKey)"
        @click="selectPreset(preset)"
      >
        <span class="bead-preset-char">{{ preset.char }}</span>
        <span class="bead-preset-label">{{ t(preset.labelKey) }}</span>
      </button>
    </div>
  </div>
</template>
