<script setup lang="ts">
import type { BitOrder, Polarity, ScanDirection } from '../engines/bitmapEncoder';

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
      <span>Scan Direction</span>
      <select v-model="settings.scanDirection" data-test="scan-direction">
        <option value="horizontal-ltr">Left → Right, Top → Bottom</option>
        <option value="horizontal-rtl">Right → Left, Top → Bottom</option>
        <option value="vertical-ttb">Top → Bottom, Left → Right</option>
        <option value="vertical-btt">Bottom → Top, Left → Right</option>
      </select>
    </label>
    <div class="field-row">
      <label class="field">
        <span>Bit Order</span>
        <select v-model="settings.bitOrder">
          <option value="msb">MSB First</option>
          <option value="lsb">LSB First</option>
        </select>
      </label>
      <label class="field">
        <span>Polarity</span>
        <select v-model="settings.polarity">
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
      </label>
    </div>
  </div>
</template>
