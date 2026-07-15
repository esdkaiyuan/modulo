<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePixelStore } from '../../../stores/pixelStore';

const store = usePixelStore();
const copied = ref(false);
const byteCount = computed(() => store.byteOutput.length);

async function copyOutput() {
  await navigator.clipboard?.writeText(store.currentOutput);
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1200);
}

function downloadOutput() {
  const url = URL.createObjectURL(store.outputBlob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = store.outputFileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="output-panel handdraw-output-panel">
    <header>
      <h2>{{ store.outputFormat === 'c-array' ? 'C ARRAY OUTPUT' : store.outputFormat === 'hex' ? 'HEX OUTPUT' : 'BINARY OUTPUT' }}</h2>
      <select v-model="store.outputFormat" data-test="handdraw-output-format">
        <option value="c-array">C Array (uint8_t)</option>
        <option value="hex">HEX Bytes</option>
        <option value="bin">Binary (.bin)</option>
      </select>
      <button @click="copyOutput">⧉ {{ copied ? 'Copied' : 'Copy' }}</button>
      <button @click="downloadOutput">⇩ Download</button>
    </header>
    <pre><code>{{ store.currentOutput }}</code></pre>
    <footer>
      <span>{{ byteCount }} bytes</span>
      <span>{{ store.outputFileName }}</span>
      <strong>✓ Fits in PROGMEM</strong>
    </footer>
  </section>
</template>
