<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useFontModuloStore } from '../stores/fontModuloStore';
import FontPixelSample from './FontPixelSample.vue';

const store = useFontModuloStore();

watch(
  () => [store.text, store.fontFamily, store.fontSize, store.bold, store.italic, store.targetWidth, store.targetHeight, store.threshold],
  () => store.generate()
);
</script>

<template>
  <PanelSection class="font-input" step="1" title="Input">
    <div class="font-input-grid">
      <label class="char-input"><strong>{{ store.text || '字' }}</strong><input v-model="store.text" aria-label="Font text" placeholder="Enter text or Chinese characters..." /><button @click="store.text = ''">×</button></label>
      <FontPixelSample variant="glyph" compact />
      <label class="field-label">Font <input v-model="store.fontFamily" /><button>↥ Upload TTF / OTF</button></label>
      <label class="field-label">Font Size <input v-model.number="store.fontSize" type="number" min="6" max="256" /><input v-model.number="store.fontSize" type="range" min="6" max="256" /></label>
      <div class="style-toggles"><label>B <input v-model="store.bold" type="checkbox" /><i></i></label><label>I <input v-model="store.italic" type="checkbox" /><i></i></label></div>
      <button class="primary-btn generate" @click="store.generate">✣ Generate</button>
    </div>
  </PanelSection>
</template>
