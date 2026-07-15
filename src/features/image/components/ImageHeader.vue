<script setup lang="ts">
import { computed, watch } from 'vue';
import { useImageModuloStore } from '../stores/imageModuloStore';

const store = useImageModuloStore();

const headerTitle = computed(() => {
  if (store.fixedMode) return 'Fixed Resolution Converter';
  return 'Image to C Array Converter';
});

watch(() => store.fixedMode, () => {
  document.body.classList.toggle('fixed-mode', store.fixedMode);
}, { immediate: true });
</script>

<template>
  <header class="dm-header">
    <div class="dm-brand">
      <span class="brand-mark image-mark">▣</span>
      <div>
        <h1>Dot Matrix Studio <span>v1.3.0</span></h1>
        <p>{{ headerTitle }}</p>
      </div>
    </div>
    <div class="header-actions">
      <div class="mode-toggle-group">
        <button :class="{ active: !store.fixedMode }" @click="store.fixedMode = false">◐ 自由取模</button>
        <button :class="{ active: store.fixedMode }" @click="store.fixedMode = true">◈ 固定取模</button>
      </div>
      <button>GitHub</button><button>☼</button><button>Light</button>
    </div>
  </header>
</template>
