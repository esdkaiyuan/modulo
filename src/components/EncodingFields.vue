<script setup lang="ts">
import type { BitOrder, Polarity, ScanDirection } from '../engines/bitmapEncoder';
import { t } from '../i18n';

// Accepts any Pinia store (or reactive object) exposing the three encoding fields.
const props = defineProps<{
  store: {
    scanDirection: ScanDirection;
    bitOrder: BitOrder;
    polarity: Polarity;
  };
}>();

const settings = props.store;
</script>

<template>
  <div class="field-stack">
    <label class="field">
      <span>{{ t('enc.scanDirection') }}</span>
      <select v-model="settings.scanDirection" data-test="scan-direction">
        <option value="horizontal-ltr">{{ t('enc.scanLtr') }}</option>
        <option value="horizontal-rtl">{{ t('enc.scanRtl') }}</option>
        <option value="vertical-ttb">{{ t('enc.scanTtb') }}</option>
        <option value="vertical-btt">{{ t('enc.scanBtt') }}</option>
      </select>
    </label>
    <div class="field-row">
      <label class="field">
        <span>{{ t('enc.bitOrder') }}</span>
        <select v-model="settings.bitOrder">
          <option value="msb">{{ t('enc.msbFirst') }}</option>
          <option value="lsb">{{ t('enc.lsbFirst') }}</option>
        </select>
      </label>
      <label class="field">
        <span>{{ t('enc.polarity') }}</span>
        <select v-model="settings.polarity">
          <option value="positive">{{ t('enc.positive') }}</option>
          <option value="negative">{{ t('enc.negative') }}</option>
        </select>
      </label>
    </div>
  </div>
</template>
