<script setup lang="ts">
type Tone = 'empty' | 'ink' | 'paper' | 'sky' | 'blue' | 'mint' | 'green' | 'yellow' | 'pink';

const props = withDefaults(defineProps<{
  variant?: 'source' | 'matrix' | 'output' | 'thumb';
  frame?: number;
  compact?: boolean;
}>(), {
  variant: 'source',
  frame: 0,
  compact: false
});

function toneFor(index: number): Tone {
  const x = index % 18;
  const y = Math.floor(index / 18);
  const shift = props.frame % 4;
  const movingX = x - shift;

  if (props.variant === 'matrix' || props.variant === 'output') {
    if (y === 2 || y === 7 || x === 2 || x === 15) return 'paper';
    if ((movingX > 3 && movingX < 12 && y > 2 && y < 7) || (x + y + props.frame) % 10 === 0) return 'ink';
    return props.variant === 'output' ? 'paper' : 'empty';
  }

  if (y < 3) return ['sky', 'blue', 'sky'][(x + props.frame) % 3] as Tone;
  if (y > 8) return ['green', 'mint'][(x + y + props.frame) % 2] as Tone;
  if ((movingX > 4 && movingX < 13 && y > 3 && y < 8) || (x + y + props.frame) % 11 === 0) {
    return ['yellow', 'pink', 'blue', 'mint'][(x + y + props.frame) % 4] as Tone;
  }
  return 'empty';
}
</script>

<template>
  <div class="video-pixel-sample" :class="[`sample-${variant}`, { compact }]" aria-hidden="true">
    <span
      v-for="dot in 198"
      :key="`${variant}-${frame}-${dot}`"
      class="pixel-dot"
      :class="toneFor(dot - 1)"
    ></span>
  </div>
</template>
