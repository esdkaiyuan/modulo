<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useFontModuloStore } from '../stores/fontModuloStore';

const store = useFontModuloStore();

watch(
  () => [store.scanDirection, store.bitOrder, store.polarity, store.invert, store.mode, store.exportFormat, store.rgb565ByteOrder, store.rgb888Order, store.foregroundColor, store.backgroundColor, store.transparentBackground, store.transparentPixelColor],
  () => store.generate()
);
</script>

<template>
  <PanelSection class="font-options" step="3" title="Encoding Options">
    <div class="option-line" data-test="font-mode"><span>◫</span> Modulo Mode<div class="segmented-control"><button type="button" :class="{ active: store.mode === 'mono' }" @click="store.mode = 'mono'">Mono</button><button type="button" :class="{ active: store.mode !== 'mono' }" @click="store.mode = 'rgb565'">Color</button></div></div>
    <label v-if="store.mode !== 'mono'" class="option-line"><span>▦</span> Color Encoding<select v-model="store.mode" data-test="font-color-encoding"><option value="rgb565">RGB565</option><option value="rgb888">RGB888</option><option value="palette16">16-color Palette</option></select></label>
    <label v-if="store.mode === 'mono'" class="option-line">
      <span>☷</span> Scanning Direction
      <select v-model="store.scanDirection">
        <option value="horizontal-ltr">Horizontal LTR (Left → Right, Top → Bottom)</option>
        <option value="horizontal-rtl">Horizontal RTL (Right → Left, Top → Bottom)</option>
        <option value="vertical-ttb">Vertical TTB (Top → Bottom, Left → Right)</option>
        <option value="vertical-btt">Vertical BTT (Bottom → Top, Left → Right)</option>
      </select>
    </label>
    <label v-if="store.mode === 'mono'" class="option-line">
      <span>⇄</span> Encoding Mode
      <select v-model="store.polarity"><option value="positive">Positive (1 = Pixel On)</option><option value="negative">Negative (0 = Pixel On)</option></select>
    </label>
    <label class="option-line">
      <span>▤</span> Bit Order (in Byte)
      <select v-model="store.bitOrder"><option value="msb">MSB First (Bit 7 → Bit 0)</option><option value="lsb">LSB First (Bit 0 → Bit 7)</option></select>
    </label>
    <label v-if="store.mode === 'rgb565'" class="option-line">
      <span>▰</span> Byte Order
      <select v-model="store.rgb565ByteOrder"><option value="msb-first">High Byte First</option><option value="lsb-first">Low Byte First</option></select>
    </label>
    <label v-if="store.mode === 'mono'" class="option-line"><span>▰</span> Byte Order<select disabled><option>Packed Byte Stream</option></select></label>
    <label v-if="store.mode === 'rgb888'" class="option-line"><span>▰</span> Channel Order<select v-model="store.rgb888Order"><option value="rgb">RGB</option><option value="bgr">BGR</option></select></label>
    <label v-if="store.mode !== 'mono'" class="option-line"><span>■</span> Foreground<input v-model="store.foregroundColor" type="color" /></label>
    <label v-if="store.mode !== 'mono'" class="option-line"><span>□</span> Background<input v-model="store.backgroundColor" type="color" :disabled="store.transparentBackground" /></label>
    <label v-if="store.mode !== 'mono'" class="option-line"><span>◩</span> Transparent Background<input v-model="store.transparentBackground" type="checkbox" /></label>
    <label v-if="store.mode !== 'mono' && store.transparentBackground" class="option-line"><span>▣</span> Binary Fallback<input v-model="store.transparentPixelColor" type="color" /></label>
    <label class="option-line">
      <span>&lt;/&gt;</span> Output Format
      <select v-model="store.exportFormat" data-test="font-export-format"><option value="c-array">C Array</option><option value="hex">HEX Text</option><option value="bin">BIN Binary</option></select>
    </label>
    <button class="ghost-primary wide" @click="store.generate">⟳ Regenerate</button>
  </PanelSection>
</template>
