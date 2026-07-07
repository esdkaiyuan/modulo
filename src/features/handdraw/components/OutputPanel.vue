<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePixelStore } from '../../../stores/pixelStore';

const store = usePixelStore();
const copied = ref(false);
const byteCount = computed(() => store.byteOutput.length);

async function copyOutput() {
  await navigator.clipboard?.writeText(store.cArrayOutput);
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1200);
}
</script>

<template>
  <section class="output-panel">
    <header>
      <h2>HEX OUTPUT</h2>
      <select>
        <option>C Array (uint8_t)</option>
        <option>HEX Bytes</option>
      </select>
      <button @click="copyOutput">⧉ {{ copied ? 'Copied' : 'Copy' }}</button>
    </header>
    <pre><code>{{ store.cArrayOutput }}</code></pre>
    <footer>
      <span>{{ byteCount }} bytes</span>
      <strong>✓ Fits in PROGMEM</strong>
    </footer>
  </section>
</template>
