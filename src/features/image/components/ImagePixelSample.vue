<script setup lang="ts">
type Tone = 'empty' | 'ink' | 'paper' | 'blue' | 'cyan' | 'pink' | 'green' | 'yellow';

const props = withDefaults(defineProps<{
  variant?: 'source' | 'matrix' | 'output';
  compact?: boolean;
}>(), {
  variant: 'source',
  compact: false
});

function toneFor(index: number): Tone {
  const x = index % 16;
  const y = Math.floor(index / 16);

  if (props.variant === 'source') {
    if (y < 2 || x < 2) return 'paper';
    if ((x > 3 && x < 12 && y > 2 && y < 6) || (x > 7 && y > 6)) return ['blue', 'cyan', 'green', 'yellow'][(x + y) % 4] as Tone;
    if ((x + y) % 7 === 0) return 'pink';
    return 'empty';
  }

  if (props.variant === 'matrix') {
    if ((x > 3 && x < 12 && y > 2 && y < 6) || (x > 7 && y > 5) || (x + y) % 9 === 0) return 'ink';
    return 'empty';
  }

  if ((x > 2 && x < 13 && y > 2 && y < 7) || (x > 8 && y > 6) || (x + y) % 8 === 0) return 'ink';
  return 'paper';
}
</script>

<template>
  <div class="image-pixel-sample" :class="[`sample-${variant}`, { compact }]" aria-hidden="true">
    <span
      v-for="dot in 128"
      :key="`${variant}-${dot}`"
      class="pixel-dot"
      :class="toneFor(dot - 1)"
    ></span>
  </div>
</template>
