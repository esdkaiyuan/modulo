<script setup lang="ts">
import { ref } from 'vue';

type ToolRoute = 'image' | 'video' | 'animation' | 'handdraw' | 'batch';

const statusMessage = ref('Ready to build dot matrix assets.');
const darkMode = ref(false);

const tools: Array<{
  title: string;
  version: string;
  description: string;
  route: ToolRoute;
  accent: string;
  icon: string;
  preview: PixelPreviewKind;
  testId: string;
}> = [
  {
    title: 'Image to C Array',
    version: 'v1.3.0',
    description: 'Convert images to C array for embedded systems',
    route: 'image',
    accent: 'blue',
    icon: 'image',
    preview: 'image',
    testId: 'launch-image'
  },
  {
    title: 'Video to Dot Matrix',
    version: 'v1.3.0',
    description: 'Extract frames from video and convert to dot matrix data',
    route: 'video',
    accent: 'green',
    icon: 'film',
    preview: 'video',
    testId: 'launch-video'
  },
  {
    title: 'Frame Extractor',
    version: 'v1.3.0',
    description: 'Extract frames from animations and generate embedded data',
    route: 'animation',
    accent: 'purple',
    icon: 'grid',
    preview: 'animation',
    testId: 'launch-animation'
  },
  {
    title: 'Pixel Editor',
    version: 'v1.4.2',
    description: 'Create and edit pixel art with built-in C array export',
    route: 'handdraw',
    accent: 'orange',
    icon: 'cat',
    preview: 'editor',
    testId: 'launch-handdraw'
  },
  {
    title: 'Batch Processor',
    version: 'v1.3.0',
    description: 'Process multiple files with powerful batch operations',
    route: 'batch',
    accent: 'blue',
    icon: 'layers',
    preview: 'batch',
    testId: 'launch-batch'
  },
  {
    title: 'Batch Data Extractor',
    version: 'v1.3.0',
    description: 'Extract data from multiple files with configurable parameters',
    route: 'batch',
    accent: 'teal',
    icon: 'database',
    preview: 'data',
    testId: 'launch-batch-data'
  }
];

const projects = [
  { name: 'panda_animation.h', module: 'Frame Extractor', time: '2 hours ago', size: '128 x 64', preview: 'animation' as const },
  { name: 'landscape_video.c', module: 'Video to Dot Matrix', time: '5 hours ago', size: '128 x 64', preview: 'video' as const },
  { name: 'cat_pixel_art.h', module: 'Pixel Editor', time: 'Yesterday', size: '32 x 32', preview: 'editor' as const }
];

type PixelPreviewKind = 'image' | 'video' | 'animation' | 'editor' | 'batch' | 'data';
type PixelTone = 'empty' | 'blue' | 'green' | 'mint' | 'purple' | 'orange' | 'pink' | 'dark' | 'white' | 'yellow' | 'red';

const previewPalettes: Record<PixelPreviewKind, PixelTone[]> = {
  image: ['empty', 'dark', 'dark', 'empty', 'white', 'white', 'pink', 'blue', 'mint'],
  video: ['blue', 'blue', 'white', 'mint', 'green', 'green', 'dark', 'purple', 'yellow'],
  animation: ['dark', 'orange', 'yellow', 'pink', 'purple', 'dark', 'empty', 'orange', 'red'],
  editor: ['empty', 'dark', 'white', 'pink', 'purple', 'mint', 'blue', 'dark', 'white'],
  batch: ['blue', 'mint', 'green', 'white', 'dark', 'purple', 'orange', 'yellow', 'empty'],
  data: ['mint', 'green', 'blue', 'dark', 'yellow', 'orange', 'purple', 'red', 'white']
};

function pixelTone(kind: PixelPreviewKind, index: number) {
  const x = index % 12;
  const y = Math.floor(index / 12);
  const palette = previewPalettes[kind];
  if ((x + y) % 5 === 0) return palette[(x + y) % palette.length];
  if (kind === 'image' && ((x > 2 && x < 9 && y > 2 && y < 6) || (x > 5 && y > 6))) return palette[(x + y * 2) % palette.length];
  if (kind === 'video' && (y > x / 2 + 2 || y > 7 - x / 3)) return palette[(x + y) % palette.length];
  if (kind === 'animation' && ((x === y) || (x + y > 9 && x + y < 14) || (x > 6 && y < 4))) return palette[(x * 2 + y) % palette.length];
  if (kind === 'editor' && ((x > 3 && x < 8 && y > 2 && y < 8) || (x === 2 && y < 4) || (x === 9 && y < 4))) return palette[(x + y) % palette.length];
  if (kind === 'batch' && (x % 3 === 1 || y % 4 === 2)) return palette[(x + y) % palette.length];
  if (kind === 'data' && (x < 3 || x > 8 || y === 2 || y === 7)) return palette[(x * y + x) % palette.length];
  return 'empty';
}

const guideSteps = [
  ['Choose Your Tool', 'Select the tool that matches your needs from above'],
  ['Upload or Create', 'Import your image/video or create pixel art'],
  ['Configure Settings', 'Adjust parameters to get the perfect output'],
  ['Generate & Export', 'Generate code and export for your project']
];

function launchTool(route: ToolRoute) {
  window.location.hash = `#/${route}`;
}

function setStatus(message: string) {
  statusMessage.value = message;
}

function toggleTheme() {
  darkMode.value = !darkMode.value;
  setStatus(darkMode.value ? 'Preview theme switched to dark.' : 'Preview theme switched to light.');
}

function openDocs() {
  setStatus('Documentation shortcut ready. Open a tool card to view its embedded workflow.');
}

function openSettings() {
  setStatus('Settings are available inside each extraction workspace.');
}

function openProject() {
  setStatus('Project loading will use exported headers and source files from the tool pages.');
}

function importFiles() {
  launchTool('image');
}

function checkUpdates() {
  setStatus('You are running Dot Matrix Studio v1.3.0.');
}

function openGithub() {
  window.open('https://github.com/esdkaiyuan/modulo', '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <div class="home-page" :class="{ 'home-page-dark': darkMode }">
    <header class="home-header">
      <div class="home-brand">
        <div class="home-logo" aria-hidden="true">
          <span v-for="dot in 36" :key="dot"></span>
        </div>
        <div>
          <h1>Dot Matrix Studio <span>v1.3.0</span></h1>
          <p>The Complete Suite for Dot Matrix Development</p>
        </div>
      </div>
      <div class="home-actions">
        <button title="Theme" @click="toggleTheme">☼</button>
        <button @click="openDocs">▱ Docs</button>
        <button @click="openSettings">⚙ Settings</button>
        <button class="avatar-btn" title="Account" @click="setStatus('Developer profile is active.')">
          <span></span>
          ⌄
        </button>
      </div>
    </header>

    <main class="home-main">
      <section class="home-hero">
        <div class="hero-copy">
          <h2>All-in-One Dot Matrix Solution</h2>
          <p>From image conversion to embedded display, everything you need in one powerful suite.</p>
          <div class="hero-tags">
            <span class="blue">▣ 6 Tools</span>
            <span class="green">▣ Multiple Formats</span>
            <span class="purple">▣ Developer Friendly</span>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="blue-matrix">
            <span v-for="dot in 64" :key="dot"></span>
          </div>
          <div class="hero-arrow">→</div>
          <div class="dot-screen">
            <span v-for="dot in 288" :key="dot"></span>
          </div>
        </div>
      </section>

      <section class="tool-grid" aria-label="Dot matrix tools">
        <article v-for="tool in tools" :key="tool.title" class="tool-card">
          <div class="tool-card-copy">
            <header>
              <span class="tool-icon-box" :class="tool.accent">{{ tool.icon }}</span>
              <h3>{{ tool.title }}</h3>
              <small>{{ tool.version }}</small>
            </header>
            <p>{{ tool.description }}</p>
            <div class="tool-card-actions">
              <button
                class="launch-btn"
                :class="tool.accent"
                :data-test="tool.testId"
                @click="launchTool(tool.route)"
              >
                ↗ Launch →
              </button>
              <button class="learn-btn" @click="setStatus(`${tool.title} uses real extraction and export tools.`)">
                Learn More
              </button>
            </div>
          </div>
          <div class="pixel-preview-window" :class="tool.accent" aria-hidden="true">
            <span
              v-for="dot in 96"
              :key="`${tool.preview}-${dot}`"
              class="pixel-dot"
              :class="pixelTone(tool.preview, dot - 1)"
            ></span>
          </div>
        </article>
      </section>

      <section class="home-bottom">
        <article class="home-panel recent-panel">
          <h3>Recent Projects</h3>
          <button
            v-for="project in projects"
            :key="project.name"
            class="project-row"
            @click="setStatus(`${project.name} selected from recent projects.`)"
          >
            <span class="project-thumb pixel-thumb" aria-hidden="true">
              <i
                v-for="dot in 25"
                :key="`${project.preview}-${dot}`"
                :class="pixelTone(project.preview, dot - 1)"
              ></i>
            </span>
            <span>
              <strong>{{ project.name }}</strong>
              <small>{{ project.module }} · {{ project.time }}</small>
            </span>
            <em>{{ project.size }}</em>
            <b>⋮</b>
          </button>
        </article>

        <article class="home-panel guide-panel">
          <div>
            <h3>Quick Start Guide</h3>
            <ol>
              <li v-for="([title, text], index) in guideSteps" :key="title">
                <span>{{ index + 1 }}</span>
                <strong>{{ title }}</strong>
                <small>{{ text }}</small>
              </li>
            </ol>
          </div>
          <div class="guide-book" aria-hidden="true"></div>
        </article>

        <article class="home-panel action-panel">
          <h3>Quick Actions</h3>
          <button @click="openProject"><span>▱</span><strong>Open Project</strong><small>Open an existing project</small><b>›</b></button>
          <button @click="importFiles"><span>⇧</span><strong>Import Files</strong><small>Import images, videos or animations</small><b>›</b></button>
          <button @click="openDocs"><span>▥</span><strong>View Documentation</strong><small>Browse guides and API reference</small><b>›</b></button>
          <button @click="checkUpdates"><span>◴</span><strong>Check for Updates</strong><small>You're running the latest version</small><b>›</b></button>
        </article>
      </section>
    </main>

    <footer class="home-footer">
      <span>© 2025 Dot Matrix Studio. All rights reserved.</span>
      <div>
        <button @click="setStatus('Privacy policy link selected.')">Privacy Policy</button>
        <i></i>
        <button @click="setStatus('Terms of service link selected.')">Terms of Service</button>
        <i></i>
        <button @click="openGithub">GitHub</button>
        <button title="GitHub" @click="openGithub">●</button>
        <button title="Community" @click="setStatus('Community shortcut selected.')">●●</button>
      </div>
    </footer>
    <p class="home-status" role="status">{{ statusMessage }}</p>
  </div>
</template>
