<script setup lang="ts">
import { computed } from 'vue';
import { watermarkUserId } from '../user/identity';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// One repeating SVG tile: "esd" (first block, slightly stronger) followed by
// the user id (second block, fainter), rotated diagonally.
const tileUrl = computed(() => {
  const id = escapeXml(watermarkUserId.value);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='190'>` +
    `<text x='24' y='110' transform='rotate(-24 140 95)'` +
    ` font-family='ui-monospace,Menlo,Consolas,monospace' font-size='12' letter-spacing='1'>` +
    `<tspan fill='rgba(122,140,170,0.11)' font-weight='700'>esdkaiyuan</tspan>` +
    `<tspan dx='9' fill='rgba(122,140,170,0.075)'>${id}</tspan>` +
    `</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
});
</script>

<template>
  <div class="watermark-layer" aria-hidden="true" data-test="watermark" :style="{ backgroundImage: tileUrl }"></div>
</template>
