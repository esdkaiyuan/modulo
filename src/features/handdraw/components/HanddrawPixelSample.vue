<script setup lang="ts">
type Tone = 'empty' | 'ink' | 'paper' | 'blue' | 'mint' | 'green' | 'yellow' | 'pink' | 'purple';

const props = withDefaults(defineProps<{
  variant?: 'mark' | 'preview' | 'layer' | 'blank';
  frame?: number;
  compact?: boolean;
}>(), {
  variant: 'preview',
  frame: 0,
  compact: false
});

function toneFor(index: number): Tone {
  const size = props.variant === 'mark' ? 8 : 12;
  const x = index % size;
  const y = Math.floor(index / size);
  const phase = props.frame % 3;

  if (props.variant === 'blank') {
    if (x === 0 || y === 0 || x === size - 1 || y === size - 1) return 'paper';
    return 'empty';
  }

  if (props.variant === 'mark') {
    if (x === 0 || y === 0 || x === size - 1 || y === size - 1) return 'ink';
    if ((x + y + phase) % 4 === 0) return 'mint';
    if (x > 2 && x < 6 && y > 2 && y < 6) return ['pink', 'purple', 'blue'][(x + y + phase) % 3] as Tone;
    return 'paper';
  }

  if ((x > 2 + phase && x < 8 + phase && y > 2 && y < 8) || (x === 2 && y > 5) || (x === 9 && y < 5)) {
    return ['pink', 'purple', 'blue', 'yellow', 'mint'][(x + y + phase) % 5] as Tone;
  }
  if (y > 8 || (x + y + phase) % 11 === 0) return 'green';
  return 'empty';
}
</script>

<template>
  <div class="handdraw-pixel-sample" :class="[`sample-${variant}`, { compact }]" aria-hidden="true">
    <span
      v-for="dot in variant === 'mark' ? 64 : 144"
      :key="`${variant}-${frame}-${dot}`"
      class="pixel-dot"
      :class="toneFor(dot - 1)"
    ></span>
  </div>
</template>
