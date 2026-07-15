<script setup lang="ts">
import { computed, ref } from 'vue';
import { buildExport, downloadExport } from '../features/shared/exportVariants';

const props = withDefaults(defineProps<{
  /** Canonical C source shown in the panel */
  source: string;
  /** C identifier / download base name */
  name: string;
  width: number;
  height: number;
  /** Flat byte data for single-frame tools */
  bytes?: number[];
  /** Per-frame byte data for multi-frame tools */
  frames?: number[][];
  extra?: Record<string, number | number[] | string>;
  title?: string;
  /** Override the shown byte count (defaults to bytes/frames size) */
  byteCount?: number;
}>(), {
  title: 'Generated Code'
});

const copied = ref(false);

const shownBytes = computed(() => {
  if (props.byteCount !== undefined) return props.byteCount;
  if (props.frames) return props.frames.reduce((sum, f) => sum + f.length, 0);
  return props.bytes?.length ?? 0;
});

const displaySource = computed(() => props.source || '// No output generated yet');

async function copy() {
  try {
    await navigator.clipboard?.writeText(props.source);
    copied.value = true;
    window.setTimeout(() => { copied.value = false; }, 1200);
  } catch { /* clipboard unavailable */ }
}

function exportAs(format: string) {
  const result = buildExport(format, {
    name: props.name,
    source: props.source,
    bytes: props.bytes,
    frames: props.frames,
    width: props.width,
    height: props.height,
    extra: props.extra
  });
  downloadExport(props.name, result);
}
</script>

<template>
  <section class="code-panel" data-test="code-output">
    <header class="code-head">
      <span class="code-title">{{ title }}</span>
      <span class="code-meta">{{ shownBytes }} bytes · {{ width }}×{{ height }}</span>
      <div class="panel-actions">
        <slot name="actions" />
        <button class="code-btn" @click="copy">{{ copied ? '✓ Copied' : '⧉ Copy' }}</button>
        <button class="code-btn accent" @click="exportAs('h')">⇩ Download .h</button>
      </div>
    </header>
    <pre class="code-body"><code>{{ displaySource }}</code></pre>
    <footer class="code-foot">
      <span class="foot-label">Export as</span>
      <button class="code-btn" @click="exportAs('h')">.h</button>
      <button class="code-btn" @click="exportAs('txt')">.txt</button>
      <button class="code-btn" @click="exportAs('md')">.md</button>
      <button class="code-btn" @click="exportAs('py')">.py</button>
      <button class="code-btn" @click="exportAs('json')">.json</button>
    </footer>
  </section>
</template>
