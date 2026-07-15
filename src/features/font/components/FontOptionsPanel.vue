<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
import { useFontModuloStore } from '../stores/fontModuloStore';

// Regeneration on setting change is handled by a debounced watch in the store.
const store = useFontModuloStore();
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
      <span>◐</span> Threshold ({{ store.threshold }})
      <input v-model.number="store.threshold" type="range" min="0" max="255" />
    </label>
    <button class="ghost-primary wide" @click="store.generate">⟳ Regenerate</button>
  </PanelSection>
</template>
