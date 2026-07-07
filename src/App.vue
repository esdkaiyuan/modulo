<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import HandDrawPage from './pages/HandDrawPage.vue';
import BatchExtractorPage from './pages/BatchExtractorPage.vue';
import FontExtractorPage from './pages/FontExtractorPage.vue';
import AnimationFramePage from './pages/AnimationFramePage.vue';
import ImageConverterPage from './pages/ImageConverterPage.vue';
import VideoExtractorPage from './pages/VideoExtractorPage.vue';

type PageId = 'handdraw' | 'batch' | 'font' | 'animation' | 'image' | 'video';

const activePage = ref<PageId>('handdraw');

function readRoute(): PageId {
  const route = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (['batch', 'font', 'animation', 'image', 'video'].includes(route)) {
    return route as PageId;
  }
  return 'handdraw';
}

function syncRoute() {
  activePage.value = readRoute();
}

const pageComponent = computed(() => {
  const pages = {
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
});
</script>

<template>
  <component :is="pageComponent" />
</template>
