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
  visual: string;
  testId: string;
}> = [
  {
    title: 'Image to C Array',
    version: 'v1.3.0',
    description: 'Convert images to C array for embedded systems',
    route: 'image',
    accent: 'blue',
    icon: 'image',
    visual: 'panda',
    testId: 'launch-image'
  },
  {
    title: 'Video to Dot Matrix',
    version: 'v1.3.0',
    description: 'Extract frames from video and convert to dot matrix data',
    route: 'video',
    accent: 'green',
    icon: 'film',
    visual: 'landscape',
    testId: 'launch-video'
  },
  {
    title: 'Frame Extractor',
    version: 'v1.3.0',
    description: 'Extract frames from animations and generate embedded data',
    route: 'animation',
    accent: 'purple',
    icon: 'grid',
    visual: 'runner',
    testId: 'launch-animation'
  },
  {
    title: 'Pixel Editor',
    version: 'v1.4.2',
    description: 'Create and edit pixel art with built-in C array export',
    route: 'handdraw',
    accent: 'orange',
    icon: 'cat',
    visual: 'cat',
    testId: 'launch-handdraw'
  },
  {
    title: 'Batch Processor',
    version: 'v1.3.0',
    description: 'Process multiple files with powerful batch operations',
    route: 'batch',
    accent: 'blue',
    icon: 'layers',
    visual: 'mountain',
    testId: 'launch-batch'
  },
  {
    title: 'Batch Data Extractor',
    version: 'v1.3.0',
    description: 'Extract data from multiple files with configurable parameters',
    route: 'batch',
    accent: 'teal',
    icon: 'database',
    visual: 'queue',
    testId: 'launch-batch-data'
  }
];

const projects = [
  ['panda_animation.h', 'Frame Extractor', '2 hours ago', '128 x 64', 'panda'],
  ['landscape_video.c', 'Video to Dot Matrix', '5 hours ago', '128 x 64', 'landscape'],
  ['cat_pixel_art.h', 'Pixel Editor', 'Yesterday', '32 x 32', 'cat']
];

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
          <div class="tool-visual" :class="tool.visual">
            <div v-if="tool.visual === 'queue'" class="queue-list">
              <span class="done">✓ Done <i></i></span>
              <span class="processing">● Processing <i></i></span>
              <span class="pending">● Pending <i></i></span>
              <span class="failed">● Error <i></i></span>
            </div>
          </div>
        </article>
      </section>

      <section class="home-bottom">
        <article class="home-panel recent-panel">
          <h3>Recent Projects</h3>
          <button
            v-for="[name, module, time, size, visual] in projects"
            :key="name"
            class="project-row"
            @click="setStatus(`${name} selected from recent projects.`)"
          >
            <span class="project-thumb" :class="visual"></span>
            <span>
              <strong>{{ name }}</strong>
              <small>{{ module }} · {{ time }}</small>
            </span>
            <em>{{ size }}</em>
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
