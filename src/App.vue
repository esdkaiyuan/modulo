<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import HomePage from './pages/HomePage.vue';
import ImageConverterPage from './pages/ImageConverterPage.vue';
import VideoExtractorPage from './pages/VideoExtractorPage.vue';
import AnimationFramePage from './pages/AnimationFramePage.vue';
import FontExtractorPage from './pages/FontExtractorPage.vue';
import BatchExtractorPage from './pages/BatchExtractorPage.vue';
import HandDrawPage from './pages/HandDrawPage.vue';
import AudioExtractorPage from './pages/AudioExtractorPage.vue';
import AiAgentPage from './pages/AiAgentPage.vue';
import UserAuthPage from './pages/UserAuthPage.vue';
import UserProfilePage from './pages/UserProfilePage.vue';
import WatermarkLayer from './components/WatermarkLayer.vue';
import GridBackdrop from './components/GridBackdrop.vue';
import { avatarCharFor, avatarHueFor, useAuthStore } from './user/authStore';
import { TOOL_META, useActivityStore } from './user/activityStore';
import { locale, t, toggleLocale } from './i18n';

const auth = useAuthStore();
const activity = useActivityStore();

const NAV = [
  { route: 'image', labelKey: 'nav.image', icon: '▣' },
  { route: 'video', labelKey: 'nav.video', icon: '▶' },
  { route: 'animation', labelKey: 'nav.animation', icon: '◧' },
  { route: 'font', labelKey: 'nav.font', icon: '字' },
  { route: 'batch', labelKey: 'nav.batch', icon: '≣' },
  { route: 'handdraw', labelKey: 'nav.handdraw', icon: '✎' },
  { route: 'audio', labelKey: 'nav.audio', icon: '♪' },
  { route: 'ai', labelKey: 'nav.ai', icon: '✦' }
] as const;

const pages: Record<string, unknown> = {
  '': HomePage,
  home: HomePage,
  image: ImageConverterPage,
  video: VideoExtractorPage,
  animation: AnimationFramePage,
  font: FontExtractorPage,
  batch: BatchExtractorPage,
  handdraw: HandDrawPage,
  audio: AudioExtractorPage,
  ai: AiAgentPage,
  user: UserAuthPage,
  profile: UserProfilePage
};

function parseRoute(): string {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0];
}

const route = ref(parseRoute());

// All tool pages and the profile require a logged-in user. The home page,
// login page, and unknown routes (which fall back to home) stay public.
const PROTECTED = new Set([
  'image', 'video', 'animation', 'font', 'batch', 'handdraw', 'audio', 'ai', 'profile'
]);

const needsLogin = computed(() => PROTECTED.has(route.value) && !auth.currentUser);

// Render the login page immediately (no flash of the protected page), then
// normalize the hash so the address bar matches what is shown.
const currentPage = computed(() => {
  if (needsLogin.value) return UserAuthPage;
  return pages[route.value] ?? HomePage;
});

watch(
  needsLogin,
  (blocked) => {
    if (blocked) {
      auth.requireLogin(route.value);
      window.location.hash = '#/user';
    }
  },
  { immediate: true }
);

// Usage history: log tool visits by the logged-in user.
watch(
  route,
  (r) => {
    if (auth.currentUser && r in TOOL_META) activity.record(r);
  },
  { immediate: true }
);

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
    <GridBackdrop />
    <WatermarkLayer />
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
          <span>{{ item.icon }}</span>{{ t(item.labelKey) }}
        </button>
      </nav>
      <button
        v-if="auth.currentUser"
        class="avatar-btn"
        data-test="nav-user"
        :class="{ active: route === 'profile' }"
        :style="{ background: `hsl(${avatarHueFor(auth.currentUser.username)} 55% 42%)` }"
        :title="auth.currentUser.username"
        @click="navigate('profile')"
      >
        {{ avatarCharFor(auth.currentUser.username) }}
      </button>
      <button v-else class="btn sm login-btn" data-test="nav-user" @click="navigate('user')">
        {{ t('auth.login') }}
      </button>
      <button
        class="lang-toggle"
        data-test="lang-toggle"
        :title="locale === 'zh' ? 'Switch to English' : '切换为中文'"
        @click="toggleLocale()"
      >
        <span class="lang-icon">文A</span>{{ locale === 'zh' ? 'EN' : '中文' }}
      </button>
    </header>
    <main class="app-main">
      <component :is="currentPage" />
    </main>
  </div>
</template>
