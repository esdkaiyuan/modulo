<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Ambient pixel animation layer sitting on the site's 24px graph-paper grid:
 *  - "blinks": random cells breathing in and out
 *  - "runners": pixels crawling along grid lines, leaving fading trails
 * Very low alpha so content stays readable. Pauses when the tab is hidden;
 * disabled entirely for prefers-reduced-motion users.
 */
const CELL = 24; // must match the body background-size grid pitch

const BLUE = [37, 99, 235] as const;
const GREEN = [61, 185, 132] as const;

const canvas = ref<HTMLCanvasElement | null>(null);
let raf = 0;
let running = false;
let dpr = 1;
let cols = 0;
let rows = 0;

interface Blink {
  x: number;
  y: number;
  born: number;
  life: number; // seconds
  peak: number; // max alpha
  green: boolean;
}

interface Runner {
  x: number;
  y: number;
  dx: number;
  dy: number;
  trail: { x: number; y: number }[];
  lastStep: number;
  stepEvery: number; // seconds per cell
  green: boolean;
}

let blinks: Blink[] = [];
let runners: Runner[] = [];
let lastSpawn = 0;

const rand = (n: number) => Math.floor(Math.random() * n);

function spawnBlink(now: number): Blink {
  return {
    x: rand(cols),
    y: rand(rows),
    born: now,
    life: 2.5 + Math.random() * 3,
    peak: 0.05 + Math.random() * 0.07,
    green: Math.random() < 0.18
  };
}

function spawnRunner(now: number): Runner {
  const fromLeft = Math.random() < 0.5;
  const horizontal = Math.random() < 0.6;
  const r: Runner = {
    x: horizontal ? (fromLeft ? -1 : cols) : rand(cols),
    y: horizontal ? rand(rows) : (fromLeft ? -1 : rows),
    dx: horizontal ? (fromLeft ? 1 : -1) : 0,
    dy: horizontal ? 0 : (fromLeft ? 1 : -1),
    trail: [],
    lastStep: now,
    stepEvery: 0.16 + Math.random() * 0.12,
    green: Math.random() < 0.25
  };
  return r;
}

function stepRunner(r: Runner, now: number) {
  if (now - r.lastStep < r.stepEvery) return;
  r.lastStep = now;
  r.trail.unshift({ x: r.x, y: r.y });
  if (r.trail.length > 10) r.trail.pop();
  // Occasionally turn 90° at a grid intersection
  if (Math.random() < 0.18) {
    const horizontal = r.dx !== 0;
    const dir = Math.random() < 0.5 ? 1 : -1;
    r.dx = horizontal ? 0 : dir;
    r.dy = horizontal ? dir : 0;
  }
  r.x += r.dx;
  r.y += r.dy;
}

function offGrid(r: Runner): boolean {
  return r.x < -12 || r.x > cols + 12 || r.y < -12 || r.y > rows + 12;
}

function paint(now: number) {
  const el = canvas.value;
  const ctx = el?.getContext('2d');
  if (!el || !ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, el.width / dpr, el.height / dpr);

  // Population control
  if (now - lastSpawn > 0.35) {
    lastSpawn = now;
    if (blinks.length < 16 && Math.random() < 0.8) blinks.push(spawnBlink(now));
    if (runners.length < 3 && Math.random() < 0.22) runners.push(spawnRunner(now));
  }
  blinks = blinks.filter((b) => now - b.born < b.life);
  runners = runners.filter((r) => !offGrid(r));

  // Breathing cells: sine envelope over their lifetime
  for (const b of blinks) {
    const p = (now - b.born) / b.life;
    const alpha = Math.sin(p * Math.PI) * b.peak;
    const [cr, cg, cb] = b.green ? GREEN : BLUE;
    ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
    ctx.fillRect(b.x * CELL + 1, b.y * CELL + 1, CELL - 1, CELL - 1);
  }

  // Runners: head + fading trail hugging the grid lines
  for (const r of runners) {
    stepRunner(r, now);
    const [cr, cg, cb] = r.green ? GREEN : BLUE;
    r.trail.forEach((tCell, i) => {
      const alpha = 0.1 * (1 - i / r.trail.length);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
      ctx.fillRect(tCell.x * CELL + 1, tCell.y * CELL + 1, CELL - 1, CELL - 1);
    });
    ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.16)`;
    ctx.fillRect(r.x * CELL + 1, r.y * CELL + 1, CELL - 1, CELL - 1);
  }
}

function frame(nowMs: number) {
  if (!running) return;
  paint(nowMs / 1000);
  raf = requestAnimationFrame(frame);
}

function start() {
  if (running || prefersReducedMotion()) return;
  running = true;
  raf = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  cancelAnimationFrame(raf);
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resize() {
  const el = canvas.value;
  if (!el) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  el.width = window.innerWidth * dpr;
  el.height = window.innerHeight * dpr;
  el.style.width = `${window.innerWidth}px`;
  el.style.height = `${window.innerHeight}px`;
  cols = Math.ceil(window.innerWidth / CELL);
  rows = Math.ceil(window.innerHeight / CELL);
}

function onVisibility() {
  if (document.hidden) stop();
  else start();
}

onMounted(() => {
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);
  start();
});

onBeforeUnmount(() => {
  stop();
  window.removeEventListener('resize', resize);
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <canvas ref="canvas" class="grid-backdrop" aria-hidden="true" data-test="grid-backdrop"></canvas>
</template>
