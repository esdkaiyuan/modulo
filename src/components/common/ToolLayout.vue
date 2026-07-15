<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{
  tool: string;
  title: string;
  subtitle?: string;
  codePanelSource?: string;
  width?: number;
  height?: number;
  showImport?: boolean;
}>(), {
  subtitle: '',
  codePanelSource: '',
  width: 128,
  height: 64,
  showImport: true
});

const leftMode = ref('default');
const codeOpen = ref(false);

const emit = defineEmits<{
  (e: 'import'): void;
  (e: 'export', format: string): void;
  (e: 'setting-change', key: string, value: unknown): void;
  (e: 'mode-change', mode: string): void;
}>();

function onImport() { emit('import'); }
function onExport(format: string) { emit('export', format); }
function onModeChange(mode: string) { leftMode.value = mode; emit('mode-change', mode); }

const displaySource = computed(() => props.codePanelSource || '// No output generated yet');

async function copyCode() {
  try {
    await navigator.clipboard.writeText(displaySource.value);
  } catch { /* ignore */ }
}

function downloadCode() {
  const blob = new Blob([displaySource.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'output.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function toggleCode() {
  codeOpen.value = !codeOpen.value;
}
</script>

<template>
  <div class="tool-layout">
    <!-- Top Bar -->
    <header class="tool-topbar">
      <div class="toolbar-brand">
        <span class="toolbar-logo">▣</span>
        <div class="toolbar-title-group">
          <h1>Dot Matrix Studio <span class="toolbar-version">v1.3.0</span></h1>
          <p>{{ subtitle || title }}</p>
        </div>
      </div>
      <div v-if="props.showImport" class="toolbar-import">
        <button class="toolbar-import-btn" @click="onImport">
          <span class="toolbar-import-icon">▣</span>
          <span>Open File</span>
        </button>
      </div>
      <div class="toolbar-quick">
        <label class="toolbar-field">
          <span>W</span>
          <input type="number" min="8" max="512" :value="props.width" @change="(e) => $emit('setting-change', 'width', Number((e.target as HTMLInputElement).value))" />
        </label>
        <span class="toolbar-sep">×</span>
        <label class="toolbar-field">
          <span>H</span>
          <input type="number" min="8" max="512" :value="props.height" @change="(e) => $emit('setting-change', 'height', Number((e.target as HTMLInputElement).value))" />
        </label>
      </div>
      <div class="toolbar-actions">
        <slot name="top-actions" />
      </div>
    </header>

    <!-- Main Area -->
    <main class="tool-main">
      <nav class="tool-left-rail">
        <slot name="left-rail" :mode="leftMode" />
      </nav>

      <section class="tool-content">
        <slot :mode="leftMode" />
      </section>

      <aside class="tool-right-rail">
        <slot name="right-rail" />
      </aside>
    </main>

    <!-- Bottom Bar -->
    <footer class="tool-bottombar">
      <div class="export-group">
        <span class="export-label">Export:</span>
        <button class="export-btn" @click="onExport('c')">.h (C)</button>
        <button class="export-btn" @click="onExport('txt')">.txt</button>
        <button class="export-btn" @click="onExport('md')">.md</button>
        <button class="export-btn" @click="onExport('py')">.py</button>
        <button class="export-btn" @click="onExport('json')">.json</button>
      </div>
      <div class="export-group">
        <button class="export-btn primary" @click="onExport('h')">Download .h</button>
        <button class="export-btn" @click="onExport('clipboard')">Copy</button>
      </div>
      <div class="export-spacer"></div>
      <slot name="bottom-extra" />
      <button class="code-toggle-btn" :class="{ open: codeOpen }" @click="toggleCode" title="Toggle code preview">
        <span class="code-toggle-icon">{{ codeOpen ? '▴' : '▸' }}</span>
        <span>Code</span>
      </button>
    </footer>

    <!-- Code Drawer: slides up from bottom, overlays content -->
    <Transition name="code-drawer">
      <div v-if="codeOpen" class="code-drawer">
        <div class="code-drawer-header">
          <span class="code-drawer-title">Generated Output</span>
          <div class="code-drawer-actions">
            <button class="code-action-btn" @click="copyCode">Copy</button>
            <button class="code-action-btn" @click="downloadCode">Download</button>
            <button class="code-action-btn code-close-btn" @click="toggleCode">✕</button>
          </div>
        </div>
        <pre class="code-drawer-body"><code>{{ displaySource }}</code></pre>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tool-layout {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 64px 1fr 52px;
  background: var(--tool-bg);
  overflow: hidden;
  position: relative;
}

/* ---- Top Bar ---- */
.tool-topbar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
  border-bottom: 1px solid var(--tool-border);
  background: var(--tool-surface-strong);
  box-shadow: var(--tool-shadow-soft);
  z-index: 10;
}

.toolbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.toolbar-logo {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--tool-border);
  font-size: 22px;
  color: var(--tool-primary);
  flex-shrink: 0;
}

.toolbar-title-group h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--tool-text);
  line-height: 1.2;
}

.toolbar-version {
  font-size: 11px;
  font-weight: 500;
  color: var(--tool-muted);
  border: 1px solid var(--tool-border);
  border-radius: 999px;
  padding: 1px 8px;
  margin-left: 6px;
}

.toolbar-title-group p {
  margin: 0;
  font-size: 12px;
  color: var(--tool-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-import { flex-shrink: 0; }

.toolbar-import-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--tool-primary);
  border-radius: var(--tool-radius-sm);
  background: var(--tool-primary);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.toolbar-import-btn:hover { background: #1a56d6; }

.toolbar-import-icon { font-size: 16px; }

.toolbar-quick {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  justify-content: center;
}

.toolbar-field {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--tool-muted);
}

.toolbar-field span {
  font-weight: 600;
  color: var(--tool-text);
  font-size: 11px;
}

.toolbar-field input {
  width: 64px;
  height: 30px;
  padding: 0 6px;
  border: 1px solid var(--tool-border);
  border-radius: 5px;
  background: #fff;
  color: var(--tool-text);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.toolbar-field select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--tool-border);
  border-radius: 5px;
  background: #fff;
  color: var(--tool-text);
  font-size: 12px;
  font-weight: 600;
}

.toolbar-select-field select { min-width: 120px; }

.toolbar-sep {
  color: var(--tool-muted);
  font-size: 14px;
  margin: 0 2px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ---- Main Area ---- */
.tool-main {
  display: grid;
  grid-template-columns: 130px 1fr 300px;
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

/* ---- Left Rail ---- */
.tool-left-rail {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 3px;
  padding: 10px 6px;
  border-right: 1px solid var(--tool-border);
  background: var(--tool-surface-strong);
  overflow-y: auto;
  flex-shrink: 0;
}

.tool-left-rail :deep(.rail-btn) {
  flex: 0 0 auto;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--tool-muted);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.2;
  min-width: 0;
}

.tool-left-rail :deep(.rail-btn):hover {
  background: var(--tool-bg);
  color: var(--tool-text);
}

.tool-left-rail :deep(.rail-btn).active {
  background: var(--tool-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(33, 103, 232, 0.28);
}

.tool-left-rail :deep(.rail-icon) {
  font-size: 18px;
  line-height: 1;
}

.tool-left-rail :deep(.rail-label) {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
}

.tool-left-rail :deep(.rail-divider) {
  width: 36px;
  height: 1px;
  background: var(--tool-border);
  margin: 6px auto;
  flex-shrink: 0;
}

/* ---- Content ---- */
.tool-content {
  min-height: 0;
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ---- Right Rail ---- */
.tool-right-rail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-left: 1px solid var(--tool-border);
  background: var(--tool-surface-strong);
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  flex-shrink: 0;
}

/* ---- Right Rail (compact for 320px) ---- */
.tool-right-rail {
  padding: 10px;
  gap: 8px;
}

.tool-right-rail :deep(.dm-card) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid var(--tool-border);
}

.tool-right-rail :deep(.dm-card-title) {
  padding: 6px 8px;
  min-height: 32px;
}

.tool-right-rail :deep(.dm-card-title) h2 {
  font-size: 11px;
  font-weight: 700;
}

.tool-right-rail :deep(.dm-card-title) .step-badge {
  width: 16px;
  height: 16px;
  font-size: 9px;
}

.tool-right-rail :deep(.field-label) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 6px 0;
  font-size: 11px;
}

.tool-right-rail :deep(.field-label) > span:first-child {
  font-size: 11px;
  font-weight: 600;
  color: var(--tool-muted);
}

.tool-right-rail :deep(.field-label) input,
.tool-right-rail :deep(.field-label) select {
  width: 100%;
  min-height: 28px;
  font-size: 11px;
  padding: 0 6px;
}

.tool-right-rail :deep(.slider-field) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 6px 0;
}

.tool-right-rail :deep(.slider-field) strong {
  font-size: 10px;
  font-weight: 600;
}

.tool-right-rail :deep(.slider-field) input[type="range"] {
  width: 100%;
  height: 3px;
}

.tool-right-rail :deep(.slider-field) input[type="number"] {
  width: 100%;
  min-height: 26px;
  font-size: 11px;
  padding: 0 4px;
}

.tool-right-rail :deep(.mode-toggle) {
  display: flex;
  gap: 3px;
  margin-bottom: 6px;
}

.tool-right-rail :deep(.mode-toggle) button {
  flex: 1;
  height: 26px;
  font-size: 10px;
  padding: 0 2px;
  border: 1px solid var(--tool-border);
  border-radius: 4px;
  background: #fff;
  color: var(--tool-muted);
  cursor: pointer;
  white-space: nowrap;
}

.tool-right-rail :deep(.mode-toggle) button.active {
  background: var(--tool-primary);
  color: #fff;
  border-color: var(--tool-primary);
}

.tool-right-rail :deep(.primary-btn) {
  width: 100%;
  min-height: 32px;
  font-size: 11px;
  border-radius: 6px;
  margin-top: 4px;
}

.tool-right-rail :deep(.resolution-row) {
  display: flex;
  gap: 6px;
}

.tool-right-rail :deep(.resolution-row) .field-label {
  flex: 1;
}

/* ---- Bottom Bar ---- */
.tool-bottombar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 52px;
  flex-shrink: 0;
  border-top: 1px solid var(--tool-border);
  background: var(--tool-surface-strong);
  z-index: 10;
}

.export-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.export-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--tool-muted);
  margin-right: 4px;
}

.export-btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--tool-border);
  border-radius: 6px;
  background: #fff;
  color: var(--tool-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.export-btn:hover {
  border-color: var(--tool-primary);
  color: var(--tool-primary);
  background: #f0f5ff;
}

.export-btn.primary {
  background: var(--tool-primary);
  color: #fff;
  border-color: var(--tool-primary);
}

.export-btn.primary:hover {
  background: #1a56d6;
}

.export-spacer { flex: 1; }

.code-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--tool-border);
  border-radius: 6px;
  background: #fff;
  color: var(--tool-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.code-toggle-btn:hover {
  border-color: var(--tool-primary);
  color: var(--tool-primary);
}

.code-toggle-btn.open {
  background: var(--tool-primary);
  color: #fff;
  border-color: var(--tool-primary);
}

.code-toggle-icon {
  font-size: 14px;
  transition: transform 0.2s;
}

/* ---- Code Drawer (overlay from bottom) ---- */
.code-drawer {
  position: absolute;
  bottom: 52px;
  left: 130px;
  right: 300px;
  max-height: 50vh;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--tool-border);
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -8px 32px rgba(30, 47, 72, 0.18);
  z-index: 20;
  overflow: hidden;
}

.code-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 40px;
  flex-shrink: 0;
  background: #22262e;
  border-bottom: 1px solid #2d323c;
}

.code-drawer-title {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.code-drawer-actions {
  display: flex;
  gap: 8px;
}

.code-action-btn {
  height: 26px;
  padding: 0 10px;
  border: 1px solid #3d434d;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.code-action-btn:hover {
  background: #3d434d;
  color: #e5e7eb;
}

.code-close-btn {
  font-size: 13px;
}

.code-drawer-body {
  flex: 1;
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  background: #1a1d23;
  color: #e5e7eb;
  font-family: "Cascadia Code", "Fira Code", Consolas, monospace;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre;
}

/* ---- Drawer Transition ---- */
.code-drawer-enter-active,
.code-drawer-leave-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}

.code-drawer-enter-from,
.code-drawer-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
