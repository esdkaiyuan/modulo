<script setup lang="ts">
import { t } from '../../../i18n';
import type { MessageKey } from '../../../i18n/messages';

defineProps<{
  activeTab: 'image' | 'draw' | 'canvas';
}>();

const emit = defineEmits<{
  (e: 'update:activeTab', value: 'image' | 'draw' | 'canvas'): void;
}>();

const tabs: Array<{
  key: 'image' | 'draw' | 'canvas';
  icon: string;
  labelKey: MessageKey;
  descKey: MessageKey;
}> = [
  { key: 'image', icon: '▣', labelKey: 'bead.tabImage', descKey: 'bead.tabImageDesc' },
  { key: 'draw', icon: '✎', labelKey: 'bead.tabDraw', descKey: 'bead.tabDrawDesc' },
  { key: 'canvas', icon: '⊞', labelKey: 'bead.tabCanvas', descKey: 'bead.tabCanvasDesc' }
];
</script>

<template>
  <div class="bead-tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="bead-tab-item"
      :class="{ active: activeTab === tab.key }"
      @click="emit('update:activeTab', tab.key)"
    >
      <span class="bead-tab-icon">{{ tab.icon }}</span>
      <span class="bead-tab-text">
        <span class="bead-tab-label">{{ t(tab.labelKey) }}</span>
        <span class="bead-tab-desc">{{ t(tab.descKey) }}</span>
      </span>
    </button>
  </div>
</template>
