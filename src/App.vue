<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import HomePage from './pages/HomePage.vue';
import HandDrawPage from './pages/HandDrawPage.vue';
import BatchExtractorPage from './pages/BatchExtractorPage.vue';
import FontExtractorPage from './pages/FontExtractorPage.vue';
import AnimationFramePage from './pages/AnimationFramePage.vue';
import ImageConverterPage from './pages/ImageConverterPage.vue';
import VideoExtractorPage from './pages/VideoExtractorPage.vue';

type PageId = 'home' | 'handdraw' | 'batch' | 'font' | 'animation' | 'image' | 'video';

const activePage = ref<PageId>('home');

function readRoute(): PageId {
  const route = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (route === '' || route === '/') {
    return 'home';
  }
  if (['handdraw', 'batch', 'font', 'animation', 'image', 'video'].includes(route)) {
    return route as PageId;
  }
  return 'home';
}

function syncRoute() {
  activePage.value = readRoute();
}

const pageComponent = computed(() => {
  const pages = {
    home: HomePage,
    handdraw: HandDrawPage,
    batch: BatchExtractorPage,
    font: FontExtractorPage,
    animation: AnimationFramePage,
    image: ImageConverterPage,
    video: VideoExtractorPage
  };

  return pages[activePage.value];
});

onMounted(() => {
  syncRoute();
  window.addEventListener('hashchange', syncRoute);
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncRoute);
  document.body.classList.remove('route-home', 'route-handdraw', 'route-batch', 'route-font', 'route-animation', 'route-image', 'route-video');
});

watch(activePage, (page, previousPage) => {
  if (previousPage) {
    document.body.classList.remove(`route-${previousPage}`);
  }
  document.body.classList.add(`route-${page}`);
}, { immediate: true });
</script>

<template>
  <component :is="pageComponent" />
</template>
