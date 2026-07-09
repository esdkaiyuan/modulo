<script setup lang="ts">
type Tone = 'empty' | 'ink' | 'paper' | 'blue' | 'cyan' | 'mint' | 'yellow' | 'purple';

const props = withDefaults(defineProps<{
  variant?: 'mark' | 'glyph' | 'bytes';
  compact?: boolean;
}>(), {
  variant: 'glyph',
  compact: false
});

function toneFor(index: number): Tone {
  const size = props.variant === 'mark' ? 8 : 14;
  const x = index % size;
  const y = Math.floor(index / size);

  if (props.variant === 'mark') {
    if (x === 0 || y === 0 || x === size - 1 || y === size - 1) return 'ink';
    if ((x === 2 || x === 5) && y > 1 && y < 6) return 'blue';
    if (y === 3 && x > 1 && x < 6) return 'cyan';
    return 'paper';
  }

  if (props.variant === 'bytes') {
    if (x < 2 || x > 11 || y === 2 || y === 6 || y === 10) return ['blue', 'cyan', 'mint'][(x + y) % 3] as Tone;
    if ((x + y) % 8 === 0) return 'yellow';
    return 'paper';
  }

  if ((x > 2 && x < 11 && y > 1 && y < 4) || (x > 2 && x < 5 && y > 3 && y < 10) || (x > 8 && x < 11 && y > 3 && y < 10) || (x > 3 && x < 10 && y > 9 && y < 12)) {
    return 'ink';
  }
  if ((x === 6 || x === 7) && y > 3 && y < 10) return 'purple';
  if ((x + y) % 13 === 0) return 'mint';
  return 'empty';
}
</script>

<template>
  <div class="font-pixel-sample" :class="[`sample-${variant}`, { compact }]" aria-hidden="true">
    <span
      v-for="dot in variant === 'mark' ? 64 : 196"
      :key="`${variant}-${dot}`"
      class="pixel-dot"
      :class="toneFor(dot - 1)"
    ></span>
  </div>
</template>
