<script setup lang="ts">
type Tone = 'empty' | 'ink' | 'paper' | 'blue' | 'cyan' | 'mint' | 'green' | 'yellow' | 'pink';

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
  const phase = props.frame % 5;
  const wave = (x + phase) % 18;

  if (props.variant === 'matrix' || props.variant === 'output') {
    if (y === 1 || y === 9 || x === 1 || x === 16) return 'paper';
    if ((wave > 4 && wave < 13 && y > 3 && y < 8) || (x + y + phase) % 11 === 0) return 'ink';
    return props.variant === 'output' ? 'paper' : 'empty';
  }

  if (y < 2) return ['blue', 'cyan'][(x + phase) % 2] as Tone;
  if (y > 8) return ['green', 'mint'][(x + y + phase) % 2] as Tone;
  if ((wave > 4 && wave < 13 && y > 2 && y < 8) || (x + y + phase) % 13 === 0) {
    return ['yellow', 'pink', 'cyan', 'blue'][(x + y + phase) % 4] as Tone;
  }
  return 'empty';
}
</script>

<template>
  <div class="animation-pixel-sample" :class="[`sample-${variant}`, { compact }]" aria-hidden="true">
    <span
      v-for="dot in 198"
      :key="`${variant}-${frame}-${dot}`"
      class="pixel-dot"
      :class="toneFor(dot - 1)"
    ></span>
  </div>
</template>
