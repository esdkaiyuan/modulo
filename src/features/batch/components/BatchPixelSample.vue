<script setup lang="ts">
type Tone = 'empty' | 'ink' | 'paper' | 'blue' | 'cyan' | 'mint' | 'green' | 'yellow' | 'pink' | 'purple';

const props = withDefaults(defineProps<{
  variant?: 'queue' | 'matrix' | 'export';
  frame?: number;
  compact?: boolean;
}>(), {
  variant: 'queue',
  frame: 0,
  compact: false
});

function toneFor(index: number): Tone {
  const x = index % 16;
  const y = Math.floor(index / 16);
  const phase = props.frame % 4;

  if (props.variant === 'matrix') {
    if (x === 1 || x === 14 || y === 1 || y === 8) return 'paper';
    if ((x > 4 && x < 12 && y > 3 && y < 8) || (x + y + phase) % 9 === 0) return 'ink';
    return 'empty';
  }

  if (props.variant === 'export') {
    if (x < 2 || y === 2 || y === 6 || x > 13) return ['blue', 'cyan', 'mint'][(x + y + phase) % 3] as Tone;
    if ((x + y + phase) % 7 === 0) return 'yellow';
    return 'paper';
  }

  if ((x > 1 && x < 6 && y > 1 && y < 5) || (x > 6 && x < 11 && y > 3 && y < 7) || (x > 10 && y > 5 && y < 9)) {
    return ['pink', 'purple', 'blue', 'mint', 'yellow'][(x + y + phase) % 5] as Tone;
  }
  if ((x + phase) % 5 === 0 && y > 1) return 'green';
  return 'empty';
}
</script>

<template>
  <div class="batch-pixel-sample" :class="[`sample-${variant}`, { compact }]" aria-hidden="true">
    <span
      v-for="dot in 160"
      :key="`${variant}-${frame}-${dot}`"
      class="pixel-dot"
      :class="toneFor(dot - 1)"
    ></span>
  </div>
</template>
