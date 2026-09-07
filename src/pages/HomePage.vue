<script setup lang="ts">
import ToolDemo from '../components/ToolDemo.vue';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/messages';

type DemoType = 'image' | 'video' | 'animation' | 'font' | 'batch' | 'handdraw' | 'audio' | 'beadpattern' | 'aiagent';
type CardSize = 'md' | 'sm' | 'banner';

// Bento rhythm: two 2-col cards, four 1-col cards, then two full-width
// banners (audio demo-left, AI demo-right) closing the grid in a zig-zag.
const tools: { route: string; demo: DemoType; icon: string; size: CardSize }[] = [
  { route: 'image', demo: 'image', icon: '▣', size: 'md' },
  { route: 'video', demo: 'video', icon: '▶', size: 'md' },
  { route: 'animation', demo: 'animation', icon: '◧', size: 'sm' },
  { route: 'font', demo: 'font', icon: '字', size: 'sm' },
  { route: 'batch', demo: 'batch', icon: '≣', size: 'sm' },
  { route: 'handdraw', demo: 'handdraw', icon: '✎', size: 'sm' },
  { route: 'audio', demo: 'audio', icon: '♪', size: 'sm' },
  { route: 'bead', demo: 'beadpattern', icon: '◎', size: 'sm' },
  { route: 'ai', demo: 'aiagent', icon: '✦', size: 'banner' }
];

const key = (demo: DemoType, part: 'title' | 'desc' | 'tag1' | 'tag2' | 'tag3') =>
  `home.${demo}.${part}` as MessageKey;

function launch(route: string) {
  window.location.hash = `#/${route}`;
}
</script>

<template>
  <div class="home">
    <div class="home-hero">
      <div class="hero-overline"><span class="px"></span><span class="px"></span><span class="px"></span> PIXEL TOOLKIT</div>
      <h1>Dot Matrix Studio</h1>
      <p>{{ t('home.subtitle') }}</p>
      <div class="hero-stats">
        <span>{{ t('home.statTools') }}</span>
        <span class="hero-dot"></span>
        <span>{{ t('home.statLocal') }}</span>
        <span class="hero-dot"></span>
        <span>{{ t('home.statOutput') }}</span>
      </div>
    </div>
    <div class="home-grid">
      <article
        v-for="(tool, i) in tools"
        :key="tool.route"
        class="tool-card"
        :class="[`tool-card--${tool.size}`, { 'tool-card--reverse': tool.route === 'ai' }]"
        :style="{ '--enter-delay': `${i * 60}ms` }"
        :data-test="`card-${tool.route}`"
        @click="launch(tool.route)"
      >
        <div class="card-demo">
          <ToolDemo :type="tool.demo" />
        </div>
        <div class="card-body">
          <header class="card-head">
            <span class="card-icon">{{ tool.icon }}</span>
            <h2>{{ t(key(tool.demo, 'title')) }}</h2>
            <span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
          </header>
          <p>{{ t(key(tool.demo, 'desc')) }}</p>
          <div class="card-foot">
            <div class="card-tags">
              <span class="card-tag">{{ t(key(tool.demo, 'tag1')) }}</span>
              <span class="card-tag">{{ t(key(tool.demo, 'tag2')) }}</span>
              <span class="card-tag">{{ t(key(tool.demo, 'tag3')) }}</span>
            </div>
            <button class="launch-btn" :data-test="`launch-${tool.route}`" @click.stop="launch(tool.route)">
              {{ t('home.launch') }}<span class="launch-arrow">→</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
