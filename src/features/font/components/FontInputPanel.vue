<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="font-input" step="1" title="Input">
    <div class="font-input-grid">
      <div class="char-input"><strong>汉</strong><span>Enter text or Chinese characters...</span><button>×</button></div>
      <label class="field-label">Font <select><option>Noto Sans CJK SC Regular</option></select><button>↥ Upload TTF / OTF</button></label>
      <label class="field-label">Font Size <input value="64" /><input type="range" value="64" /></label>
      <div class="style-toggles"><span>B <i></i></span><span>I <i></i></span></div>
      <button class="primary-btn generate">✣ Generate</button>
    </div>
  </PanelSection>
</template>
