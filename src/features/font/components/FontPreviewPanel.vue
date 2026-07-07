<script setup lang="ts">
import PanelSection from '../../../components/common/PanelSection.vue';
</script>

<template>
  <PanelSection class="font-preview" step="2" title="Pixel Preview">
    <template #actions><span class="tag">Width: 32 px</span><span class="tag">Height: 32 px</span><span class="tag">Total: 1024 bits</span></template>
    <div class="font-preview-layout">
      <div class="tool-column"><button>■ Pixel</button><button class="active">▦ Grid</button><button>□ Invert</button></div>
      <div class="han-grid">汉</div>
    </div>
    <footer class="zoom-footer"><button>−</button><span>400%</span><button>＋</button><input type="range" value="60" /><button>⌕</button><button>⛶</button></footer>
  </PanelSection>
</template>
