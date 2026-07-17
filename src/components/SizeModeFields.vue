<script setup lang="ts">
import type { SizeMode } from '../features/shared/sizeMode';
import { t } from '../i18n';

const props = defineProps<{
  store: {
    sizeMode: SizeMode;
    aspectLongEdge: number;
    targetWidth: number;
    targetHeight: number;
  };
  variant?: 'source' | 'square' | 'per-item';
}>();

const s = props.store;
const variant = props.variant ?? 'source';
</script>

<template>
  <div class="field-stack">
    <div class="btn-group" role="tablist" aria-label="Size mode">
      <button
        type="button"
        class="btn sm"
        :class="{ toggled: s.sizeMode === 'custom' }"
        data-test="size-mode-custom"
        @click="s.sizeMode = 'custom'"
      >{{ t('size.custom') }}</button>
      <button
        type="button"
        class="btn sm"
        :class="{ toggled: s.sizeMode === 'aspect' }"
        data-test="size-mode-aspect"
        @click="s.sizeMode = 'aspect'"
      >{{ variant === 'square' ? t('size.square') : t('size.aspect') }}</button>
    </div>

    <template v-if="s.sizeMode === 'custom'">
      <div class="field-row">
        <label class="field">
          <span>{{ t('common.width') }}</span>
          <input type="number" min="1" max="1024" v-model.number="s.targetWidth" data-test="target-width" />
        </label>
        <label class="field">
          <span>{{ t('common.height') }}</span>
          <input type="number" min="1" max="1024" v-model.number="s.targetHeight" data-test="target-height" />
        </label>
      </div>
      <p class="hint">{{ variant === 'square' ? t('size.freeGlyphHint') : t('size.freeHint') }}</p>
    </template>

    <template v-else>
      <label class="field">
        <span>{{ variant === 'square' ? t('size.cellSize') : t('size.longEdge') }}</span>
        <input type="number" min="1" max="1024" v-model.number="s.aspectLongEdge" data-test="aspect-long-edge" />
      </label>
      <p class="hint" data-test="aspect-result">
        <template v-if="variant === 'square'">{{ t('size.squareResult', { w: s.targetWidth, h: s.targetHeight }) }}</template>
        <template v-else-if="variant === 'per-item'">{{ t('size.perItemResult', { n: s.aspectLongEdge }) }}</template>
        <template v-else>{{ t('size.aspectResult', { w: s.targetWidth, h: s.targetHeight }) }}</template>
      </p>
    </template>
  </div>
</template>
