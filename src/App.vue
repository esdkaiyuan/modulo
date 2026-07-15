<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import HomePage from './pages/HomePage.vue';
import ImageConverterPage from './pages/ImageConverterPage.vue';
import VideoExtractorPage from './pages/VideoExtractorPage.vue';
import AnimationFramePage from './pages/AnimationFramePage.vue';
import FontExtractorPage from './pages/FontExtractorPage.vue';
import BatchExtractorPage from './pages/BatchExtractorPage.vue';
import HandDrawPage from './pages/HandDrawPage.vue';

const NAV = [
  { route: 'image', label: 'Image', icon: '▣' },
  { route: 'video', label: 'Video', icon: '▶' },
  { route: 'animation', label: 'Animation', icon: '◧' },
  { route: 'font', label: 'Font', icon: '字' },
  { route: 'batch', label: 'Batch', icon: '≣' },
  { route: 'handdraw', label: 'Draw', icon: '✎' }
] as const;

const pages: Record<string, unknown> = {
  '': HomePage,
  home: HomePage,
  image: ImageConverterPage,
  video: VideoExtractorPage,
  animation: AnimationFramePage,
  font: FontExtractorPage,
  batch: BatchExtractorPage,
  handdraw: HandDrawPage
};

function parseRoute(): string {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0];
}

const route = ref(parseRoute());
const currentPage = computed(() => pages[route.value] ?? HomePage);

function onHashChange() {
  route.value = parseRoute();
}

function navigate(target: string) {
  window.location.hash = target ? `#/${target}` : '#/';
}

onMounted(() => window.addEventListener('hashchange', onHashChange));
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange));
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="brand" @click="navigate('')">
        <span class="brand-logo">▣</span>
        <span class="brand-name">Dot Matrix Studio</span>
        <span class="brand-version">v2.0</span>
      </div>
      <nav class="app-nav">
        <button
          v-for="item in NAV"
          :key="item.route"
          class="nav-link"
          :class="{ active: route === item.route }"
          :data-test="`nav-${item.route}`"
          @click="navigate(item.route)"
        >
          <span>{{ item.icon }}</span>{{ item.label }}
        </button>
      </nav>
    </header>
    <main class="app-main">
      <component :is="currentPage" />
    </main>
  </div>
</template>
