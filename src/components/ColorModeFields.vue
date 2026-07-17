<script setup lang="ts">
import { computed } from 'vue';
import { COLOR_FORMAT_INFO, type ColorByteOrder, type ColorMode } from '../engines/colorProcessor';
import { t } from '../i18n';

// Accepts any Pinia store (or reactive object) exposing the color fields.
const props = defineProps<{
  store: {
    colorMode: ColorMode;
    colorByteOrder: ColorByteOrder;
  };
}>();

const settings = props.store;

const bytesPerPixelHint = computed(() => {
  if (settings.colorMode === 'mono') return t('color.bitPerPixel');
  const info = COLOR_FORMAT_INFO[settings.colorMode];
  const base = t('color.bytesPerPixel', { n: info.bytesPerPixel });
  return settings.colorMode === 'palette16' ? base + t('color.paletteSuffix') : base;
});

// Byte order only matters for multi-byte / palette formats.
const showByteOrder = computed(() => settings.colorMode === 'rgb565' || settings.colorMode === 'palette16');
</script>

<template>
  <div class="field-stack">
    <label class="field">
      <span>{{ t('color.mode') }}</span>
      <select v-model="settings.colorMode" data-test="color-mode">
        <option value="mono">{{ t('color.mono') }}</option>
        <option value="rgb565">{{ t('color.rgb565') }}</option>
        <option value="rgb888">{{ t('color.rgb888') }}</option>
        <option value="rgb332">{{ t('color.rgb332') }}</option>
        <option value="palette16">{{ t('color.palette16') }}</option>
      </select>
    </label>
    <label v-if="showByteOrder" class="field">
      <span>{{ t('color.byteOrder') }}</span>
      <select v-model="settings.colorByteOrder" data-test="color-byte-order">
        <option value="big">{{ t('color.bigEndian') }}</option>
        <option value="little">{{ t('color.littleEndian') }}</option>
      </select>
    </label>
    <p class="hint">{{ bytesPerPixelHint }}</p>
  </div>
</template>
