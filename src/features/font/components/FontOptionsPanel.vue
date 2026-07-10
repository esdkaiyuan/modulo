<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useFontModuloStore } from '../stores/fontModuloStore';

const store = useFontModuloStore();

watch(
  () => [store.scanDirection, store.bitOrder, store.polarity, store.invert],
  () => store.generate()
);
</script>

<template>
  <PanelSection class="font-options" step="3" title="Encoding Options">
    <label class="option-line">
      <span>☷</span> Scanning Direction
      <select v-model="store.scanDirection">
        <option value="horizontal-ltr">Horizontal LTR (Left → Right, Top → Bottom)</option>
        <option value="horizontal-rtl">Horizontal RTL (Right → Left, Top → Bottom)</option>
        <option value="vertical-ttb">Vertical TTB (Top → Bottom, Left → Right)</option>
        <option value="vertical-btt">Vertical BTT (Bottom → Top, Left → Right)</option>
      </select>
    </label>
    <label class="option-line">
      <span>⇄</span> Encoding Mode
      <select v-model="store.polarity"><option value="positive">Positive (1 = Pixel On)</option><option value="negative">Negative (0 = Pixel On)</option></select>
    </label>
    <label class="option-line">
      <span>▤</span> Bit Order (in Byte)
      <select v-model="store.bitOrder"><option value="msb">MSB First (Bit 7 → Bit 0)</option><option value="lsb">LSB First (Bit 0 → Bit 7)</option></select>
    </label>
    <label class="option-line">
      <span>▰</span> Byte Order
      <select><option>Big Endian</option></select>
    </label>
    <label class="option-line">
      <span>&lt;/&gt;</span> Output Format
      <select><option>C Array (uint8_t [])</option></select>
    </label>
    <button class="ghost-primary wide" @click="store.generate">⟳ Regenerate</button>
  </PanelSection>
</template>
