<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

type ToolRoute = 'image' | 'video' | 'animation' | 'handdraw' | 'batch' | 'font';

const statusMessage = ref('Ready to build dot matrix assets.');
const darkMode = ref(false);
const accountMenuOpen = ref(false);

const accountUser = {
  name: 'PixelCraft Developer',
  username: '@kaiyuan',
  userId: 'U-1024-7788',
  email: 'kaiyuan@pixelcraft.dev',
  role: 'Pro Developer',
  avatarSeed: 'K'
};

const accountMenuItems = [
  { key: 'profile', label: 'View detailed personal info', icon: 'user' },
  { key: 'projects', label: 'My Projects', icon: 'folder' },
  { key: 'billing', label: 'Billing & Plan', icon: 'card' },
  { key: 'preferences', label: 'Preferences', icon: 'gear' },
  { key: 'help', label: 'Help & Support', icon: 'help' },
  { key: 'logout', label: 'Sign out', icon: 'logout', danger: true }
];

const tools: Array<{
  title: string;
  version: string;
  description: string;
  route: ToolRoute;
  accent: string;
  icon: string;
  svgIcon: string;
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
    svgIcon: 'image',
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
    svgIcon: 'video',
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
    svgIcon: 'animation',
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
    svgIcon: 'editor',
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
    svgIcon: 'batch',
    preview: 'batch',
    testId: 'launch-batch'
  },
  {
    title: 'Font Extractor',
    version: 'v1.3.0',
    description: 'Render text and Chinese characters into embedded dot matrix data',
    route: 'font',
    accent: 'teal',
    icon: 'font',
    svgIcon: 'font',
    preview: 'font',
    testId: 'launch-font'
  }
];

const projects = [
  { name: 'panda_animation.h', module: 'Frame Extractor', time: '2 hours ago', size: '128 x 64', preview: 'animation' as const },
  { name: 'landscape_video.c', module: 'Video to Dot Matrix', time: '5 hours ago', size: '128 x 64', preview: 'video' as const },
  { name: 'cat_pixel_art.h', module: 'Pixel Editor', time: 'Yesterday', size: '32 x 32', preview: 'editor' as const }
];

type PixelPreviewKind = 'image' | 'video' | 'animation' | 'editor' | 'batch' | 'font';
type PixelTone = 'empty' | 'blue' | 'green' | 'mint' | 'purple' | 'orange' | 'pink' | 'dark' | 'white' | 'yellow' | 'red';

const previewPalettes: Record<PixelPreviewKind, PixelTone[]> = {
  image: ['empty', 'dark', 'dark', 'empty', 'white', 'white', 'pink', 'blue', 'mint'],
  video: ['blue', 'blue', 'white', 'mint', 'green', 'green', 'dark', 'purple', 'yellow'],
  animation: ['dark', 'orange', 'yellow', 'pink', 'purple', 'dark', 'empty', 'orange', 'red'],
  editor: ['empty', 'dark', 'white', 'pink', 'purple', 'mint', 'blue', 'dark', 'white'],
  batch: ['blue', 'mint', 'green', 'white', 'dark', 'purple', 'orange', 'yellow', 'empty'],
  font: ['dark', 'white', 'blue', 'mint', 'purple', 'yellow', 'empty', 'pink', 'green']
};

const previewFrames = [0, 1, 2];

function pixelTone(kind: PixelPreviewKind, index: number, frame = 0) {
  const x = index % 12;
  const y = Math.floor(index / 12);
  const palette = previewPalettes[kind];
  const shiftedX = (x + frame * 2) % 12;
  const shiftedY = (y + frame) % 8;
  const pick = (salt = 0) => palette[(x + y * 2 + frame * 3 + salt) % palette.length];

  if ((x + y + frame) % 7 === 0) return pick(1);
  if (kind === 'image' && ((x > 1 + frame && x < 8 + frame && y > 2 && y < 6) || (x > 6 - frame && y > 5))) return pick();
  if (kind === 'video' && (y > shiftedX / 2 + 1 || shiftedY > 5 || (x + frame) % 5 === 0)) return pick(2);
  if (kind === 'animation' && (((x + frame) % 6 === y % 6) || (x + y > 8 + frame && x + y < 14 + frame) || (x > 6 && y < 3 + frame))) return pick(3);
  if (kind === 'editor' && ((x > 3 && x < 8 && y > 1 + frame && y < 7) || (x === 2 + frame && y < 4) || (x === 9 - frame && y < 4))) return pick();
  if (kind === 'batch' && ((x + frame) % 3 === 1 || (y + frame) % 4 === 2)) return pick(4);
  if (kind === 'font' && ((x > 1 && x < 4 && y > 1 && y < 7) || (x > 6 && x < 10 && y > 1 + frame && y < 7) || (y === 2 && x > 2 && x < 10) || (x === 10 - frame && y > 3))) return pick(5);
  return 'empty';
}

const svgIcons: Record<string, string> = {
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
  video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  animation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/></svg>`,
  editor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  batch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16h6"/><path d="M19 13v6"/><path d="M21 3H9l-7 7 7 7h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/></svg>`,
  font: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
  card: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`,
  help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
};

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

function toggleAccountMenu(event: MouseEvent) {
  event.stopPropagation();
  accountMenuOpen.value = !accountMenuOpen.value;
}

function closeAccountMenu() {
  accountMenuOpen.value = false;
}

function handleAccountAction(key: string, label: string) {
  if (key === 'logout') {
    accountMenuOpen.value = false;
    setStatus(`Signed out of ${accountUser.name}. See you soon!`);
    return;
  }
  if (key === 'profile') {
    setStatus(`Opening detailed profile for ${accountUser.name} (${accountUser.userId}).`);
  } else {
    setStatus(`${label} is ready inside the account workspace.`);
  }
  accountMenuOpen.value = false;
}

function handleAccountClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (!target.closest('.account-menu')) {
    accountMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleAccountClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountClickOutside);
});
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
        <div class="account-menu" :class="{ open: accountMenuOpen }">
          <button
            class="avatar-btn"
            title="Account"
            :aria-expanded="accountMenuOpen"
            aria-haspopup="menu"
            @click="toggleAccountMenu"
          >
            <span>{{ accountUser.avatarSeed }}</span>
            <em>{{ accountUser.username }}</em>
            <i class="caret" :class="{ flipped: accountMenuOpen }">⌄</i>
          </button>
          <div v-if="accountMenuOpen" class="account-dropdown" role="menu">
            <header class="account-card">
              <div class="account-avatar" aria-hidden="true">{{ accountUser.avatarSeed }}</div>
              <div class="account-identity">
                <strong>{{ accountUser.name }}</strong>
                <small>{{ accountUser.username }}</small>
                <span class="role-badge">{{ accountUser.role }}</span>
              </div>
            </header>
            <dl class="account-meta">
              <div>
                <dt>User ID</dt>
                <dd>{{ accountUser.userId }}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{{ accountUser.email }}</dd>
              </div>
            </dl>
            <ul class="account-actions">
              <li v-for="item in accountMenuItems" :key="item.key">
                <button
                  role="menuitem"
                  :class="{ 'is-danger': item.danger }"
                  @click="handleAccountAction(item.key, item.label)"
                >
                  <span class="account-action-icon" v-html="svgIcons[item.icon]" aria-hidden="true"></span>
                  <span>{{ item.label }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
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
              <span class="tool-icon-box" :class="tool.accent" v-html="svgIcons[tool.svgIcon]"></span>
              <h3>{{ tool.title }}</h3>
              <small>{{ tool.version }}</small>
            </header>
            <p>{{ tool.description }}</p>
            <div class="tool-card-actions">
              <button
                class="launch-btn launch-readable"
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
          <div class="pixel-preview-window" :class="tool.accent" :data-preview-kind="tool.preview" aria-hidden="true">
            <div
              v-for="frame in previewFrames"
              :key="`${tool.preview}-frame-${frame}`"
              class="pixel-preview-frame"
              :style="{ animationDelay: `${frame * 1.6}s` }"
            >
              <span
                v-for="dot in 96"
                :key="`${tool.preview}-${frame}-${dot}`"
                class="pixel-dot"
                :class="pixelTone(tool.preview, dot - 1, frame)"
              ></span>
            </div>
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
