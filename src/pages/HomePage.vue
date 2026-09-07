<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import ToolDemo from '../components/ToolDemo.vue';
import { t } from '../i18n';
import type { MessageKey } from '../i18n/messages';


// ── Hero pixel background animation ─────────────────────
const heroCanvas = ref<HTMLCanvasElement | null>(null);
let heroRaf = 0;
let heroT0 = 0;

function drawHeroPixels(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h);

  const cols = 48;
  const rows = 16;
  const cw = w / cols;
  const ch = h / rows;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Wave pattern that flows across
      const wave = Math.sin(x * 0.25 + t * 1.2) * Math.cos(y * 0.35 + t * 0.8) * 0.5 + 0.5;
      // Random twinkle
      const twinkle = Math.sin(x * 7.3 + y * 4.1 + t * 2.5) * 0.5 + 0.5;
      const intensity = Math.max(0, (wave * 0.6 + twinkle * 0.4 - 0.35));

      if (intensity > 0.02) {
        const px = Math.floor(intensity * 4); // 0-4 levels
        const colors = ['rgba(79,131,232,0.08)', 'rgba(79,131,232,0.18)', 'rgba(79,131,232,0.32)', 'rgba(79,131,232,0.5)'];
        ctx.fillStyle = colors[Math.min(px, 3)];
        const pad = cw * 0.2;
        ctx.fillRect(x * cw + pad, y * ch + pad, cw - pad * 2, ch - pad * 2);
      }
    }
  }

  // Floating pixel sprites (small icons drifting)
  const sprites = [
    { x: (t * 25) % (w + 40) - 20, y: 20 + Math.sin(t * 1.5) * 10, s: 3, c: '#4f83e8' },
    { x: (w - (t * 18) % (w + 40)) + 20, y: h - 30 + Math.sin(t * 2 + 1) * 8, s: 2, c: '#6fa0f0' },
    { x: (t * 35) % (w + 60) - 30, y: h / 2 + Math.cos(t * 1.2) * 25, s: 2, c: '#9ec1fa' },
  ];
  for (const s of sprites) {
    ctx.fillStyle = s.c;
    const size = s.s * 2;
    ctx.fillRect(s.x - size / 2, s.y - size / 2, size, size);
  }
}

onMounted(() => {
  const canvas = heroCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  heroT0 = performance.now();
  const loop = (now: number) => {
    const t = (now - heroT0) / 1000;
    const rect = canvas.getBoundingClientRect();
    drawHeroPixels(ctx, rect.width, rect.height, t);
    heroRaf = requestAnimationFrame(loop);
  };
  heroRaf = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  if (heroRaf) cancelAnimationFrame(heroRaf);
});type DemoType = 'image' | 'video' | 'animation' | 'font' | 'batch' | 'handdraw' | 'audio' | 'beadpattern' | 'aiagent';
type CardSize = 'md' | 'sm' | 'banner';

// Bento rhythm: two 2-col cards, four 1-col cards, then two full-width
// banners (audio demo-left, AI demo-right) closing the grid in a zig-zag.
const tools: { route: string; demo: DemoType | 'coming' | 'coming2'; icon: string; size: CardSize; soon?: boolean; label?: string }[] = [
  { route: 'image', demo: 'image', icon: '▣', size: 'md' },
  { route: 'video', demo: 'video', icon: '▶', size: 'md' },
  { route: 'animation', demo: 'animation', icon: '◧', size: 'sm' },
  { route: 'font', demo: 'font', icon: '字', size: 'sm' },
  { route: 'batch', demo: 'batch', icon: '≣', size: 'sm' },
  { route: 'handdraw', demo: 'handdraw', icon: '✎', size: 'sm' },
  { route: 'audio', demo: 'audio', icon: '♪', size: 'sm' },
  { route: 'bead', demo: 'beadpattern', icon: '◎', size: 'sm' },
  { route: '', demo: 'coming', icon: '⌛', size: 'sm', soon: true, label: 'home.comingSoon.midi' },
  { route: '', demo: 'coming2', icon: '✨', size: 'sm', soon: true, label: 'home.comingSoon.surprise' },
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
      <canvas ref="heroCanvas" class="hero-canvas" aria-hidden="true"></canvas>
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
