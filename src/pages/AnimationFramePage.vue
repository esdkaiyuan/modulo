<script setup lang="ts">
import AnimationHeader from '../features/animation/components/AnimationHeader.vue';
import AnimationWorkspace from '../features/animation/components/AnimationWorkspace.vue';
import AnimationSettings from '../features/animation/components/AnimationSettings.vue';
import AnimationOutput from '../features/animation/components/AnimationOutput.vue';
</script>

<template>
  <div class="dm-page animation-page animation-reference-shell with-local-rail responsive-tool-page tool-ui-frame">
    <aside class="local-rail animation-tool-rail">
      <button class="active">▣<span>Extractor</span></button>
      <button>▦<span>Preview</span></button>
      <button>◌<span>Palette</span></button>
      <button>⋮<span>Dithering</span></button>
      <button>⌕<span>Tools</span></button>
      <button>⚙<span>Settings</span></button>
      <div class="rail-theme"><button>☼ Light</button><button>◐ Dark</button></div>
    </aside>
    <section class="local-workspace">
      <AnimationHeader />
      <main class="animation-reference-grid">
        <div class="animation-main-row">
          <div class="animation-center-stack">
            <AnimationWorkspace />
          </div>
          <aside class="animation-side-rail">
            <AnimationSettings />
          </aside>
        </div>
        <AnimationOutput />
      </main>
    </section>
  </div>
</template>
