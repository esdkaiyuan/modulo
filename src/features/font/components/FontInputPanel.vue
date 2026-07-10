<script setup lang="ts">
import { watch } from 'vue';
import PanelSection from '../../../components/common/PanelSection.vue';
import { useFontModuloStore } from '../stores/fontModuloStore';

const store = useFontModuloStore();

watch(
  () => [store.text, store.fontFamily, store.fontSize, store.bold, store.italic, store.targetWidth, store.targetHeight, store.threshold],
  () => store.generate()
);
</script>

<template>
  <PanelSection class="font-input font-input-row" step="1" title="Input">
    <div class="font-input-grid">
      <label class="char-input"><strong>{{ store.text || '汉' }}</strong><input v-model="store.text" aria-label="Font text" placeholder="Enter text or Chinese characters..." /><button @click="store.text = ''">×</button></label>
      <label class="field-label font-family-field">Font
        <select v-model="store.fontFamily">
          <option value="Noto Sans CJK SC, Microsoft YaHei, SimSun, sans-serif">Noto Sans CJK SC Regular</option>
          <option value="Microsoft YaHei, Noto Sans CJK SC, sans-serif">Microsoft YaHei Regular</option>
          <option value="SimSun, Noto Sans CJK SC, serif">SimSun Regular</option>
          <option value="Arial, sans-serif">Arial Regular</option>
        </select>
        <button>↥ Upload TTF / OTF</button>
      </label>
      <label class="field-label font-size-field">Font Size
        <span class="number-with-unit"><input v-model.number="store.fontSize" type="number" min="6" max="256" /><b>px</b></span>
        <input v-model.number="store.fontSize" type="range" min="6" max="256" />
      </label>
      <div class="style-toggles"><label>B <input v-model="store.bold" type="checkbox" /><i></i></label><label>I <input v-model="store.italic" type="checkbox" /><i></i></label></div>
      <div class="font-generate-zone"><button class="primary-btn generate" @click="store.generate">✣ Generate</button></div>
    </div>
  </PanelSection>
</template>
