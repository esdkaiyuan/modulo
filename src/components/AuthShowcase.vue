<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import ToolDemo from './ToolDemo.vue';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/messages';

/**
 * Auth-page hero: cycles through the seven tool demo animations so the
 * login / register screen leads with the site's dot-matrix signature look.
 */
const SLIDES = [
  { type: 'image', titleKey: 'home.image.title' },
  { type: 'video', titleKey: 'home.video.title' },
  { type: 'animation', titleKey: 'home.animation.title' },
  { type: 'font', titleKey: 'home.font.title' },
  { type: 'batch', titleKey: 'home.batch.title' },
  { type: 'handdraw', titleKey: 'home.handdraw.title' },
  { type: 'audio', titleKey: 'home.audio.title' }
] as const satisfies ReadonlyArray<{
  type: 'image' | 'video' | 'animation' | 'font' | 'batch' | 'handdraw' | 'audio';
  titleKey: MessageKey;
}>;

const CYCLE_MS = 3500;
const idx = ref(0);
const slide = computed(() => SLIDES[idx.value]);
let timer: ReturnType<typeof setInterval> | null = null;

function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    idx.value = (idx.value + 1) % SLIDES.length;
  }, CYCLE_MS);
}

function goTo(i: number) {
  idx.value = i;
  startTimer(); // restart the countdown after a manual jump
}

onMounted(startTimer);
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="auth-showcase" data-test="auth-showcase">
    <div class="showcase-brand">
      <span class="brand-logo">▣</span>
      <span>Dot Matrix Studio</span>
    </div>
    <ToolDemo :key="slide.type" :type="slide.type" class="showcase-demo" />
    <div class="showcase-meta">
      <Transition name="fade" mode="out-in">
        <span :key="idx" class="showcase-caption" data-test="showcase-caption">{{ t(slide.titleKey) }}</span>
      </Transition>
      <div class="showcase-dots" role="tablist">
        <button
          v-for="(s, i) in SLIDES"
          :key="s.type"
          class="showcase-dot"
          :class="{ active: i === idx }"
          :aria-label="t(s.titleKey)"
          :data-test="`showcase-dot-${s.type}`"
          @click="goTo(i)"
        ></button>
      </div>
    </div>
    <p class="showcase-tag">{{ t('home.subtitle') }}</p>
  </div>
</template>
