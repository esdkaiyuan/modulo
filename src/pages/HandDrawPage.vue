<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Panel from '../components/Panel.vue';
import { usePixelStore, type Tool } from '../stores/pixelStore';
import { buildExport, downloadExport } from '../features/shared/exportVariants';

const store = usePixelStore();
const canvas = ref<HTMLCanvasElement | null>(null);
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const colorInput = ref<HTMLInputElement | null>(null);
const isDrawing = ref(false);
const copied = ref(false);

const TOOLS: Array<{ key: Tool; label: string; icon: string; shortcut: string }> = [
  { key: 'pencil', label: 'Pencil', icon: '✎', shortcut: 'B' },
  { key: 'eraser', label: 'Eraser', icon: '⌫', shortcut: 'E' },
  { key: 'fill', label: 'Fill', icon: '◉', shortcut: 'G' },
  { key: 'eyedropper', label: 'Picker', icon: '⌖', shortcut: 'I' }
];

const cellSize = computed(() => Math.max(8, Math.round(store.zoom / 50)));
const canvasSize = computed(() => store.width * cellSize.value);

// ── Canvas rendering ─────────────────────────────────
function render() {
  const el = canvas.value;
  if (!el) return;
  el.width = canvasSize.value;
  el.height = canvasSize.value;
  const ctx = el.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, el.width, el.height);

  const cell = cellSize.value;
  store.pixels.forEach((color, index) => {
    if (!color) return;
    const x = index % store.width;
    const y = Math.floor(index / store.width);
    ctx.fillStyle = color;
    ctx.fillRect(x * cell, y * cell, cell, cell);
  });

  if (store.showGrid && cell >= 6) {
    ctx.strokeStyle = 'rgba(140, 150, 165, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= store.width; i += 1) {
      const pos = i * cell + 0.5;
      ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, el.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(el.width, pos); ctx.stroke();
    }
  }
}

function renderPreview() {
  const el = previewCanvas.value;
  if (!el) return;
  const scale = Math.max(1, Math.floor(160 / store.width));
  el.width = store.width * scale;
  el.height = store.height * scale;
  const ctx = el.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, el.width, el.height);
  store.pixels.forEach((color, index) => {
    if (!color) return;
    const x = index % store.width;
    const y = Math.floor(index / store.width);
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  });
}

// ── Pointer painting ─────────────────────────────────
function pointerToPixel(event: PointerEvent) {
  const el = canvas.value;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / cellSize.value);
  const y = Math.floor((event.clientY - rect.top) / cellSize.value);
  if (x < 0 || y < 0 || x >= store.width || y >= store.height) return null;
  return { x, y };
}

function drawAt(event: PointerEvent) {
  const pixel = pointerToPixel(event);
  if (!pixel) return;
  store.setCursor(pixel.x, pixel.y);
  store.paintPixel(pixel.x, pixel.y);
}

function onPointerDown(event: PointerEvent) {
  isDrawing.value = true;
  canvas.value?.setPointerCapture(event.pointerId);
  if (store.activeTool === 'pencil' || store.activeTool === 'eraser') store.beginStroke();
  drawAt(event);
}

function onPointerMove(event: PointerEvent) {
  const pixel = pointerToPixel(event);
  if (pixel) store.setCursor(pixel.x, pixel.y);
  if (isDrawing.value && store.activeTool !== 'fill' && store.activeTool !== 'eyedropper') drawAt(event);
}

function onPointerUp(event: PointerEvent) {
  if (isDrawing.value) store.endStroke();
  isDrawing.value = false;
  canvas.value?.releasePointerCapture(event.pointerId);
}

// ── Palette ──────────────────────────────────────────
function addPaletteColor(e: Event) {
  const color = (e.target as HTMLInputElement).value;
  if (color && !store.palette.includes(color)) store.palette.push(color);
}

// ── Keyboard shortcuts ───────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    e.shiftKey ? store.redo() : store.undo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    store.redo();
    return;
  }
  const map: Record<string, Tool> = { b: 'pencil', e: 'eraser', g: 'fill', i: 'eyedropper' };
  const tool = map[e.key.toLowerCase()];
  if (tool) store.setTool(tool);
}

// ── Output ───────────────────────────────────────────
async function copyOutput() {
  try {
    await navigator.clipboard?.writeText(store.currentOutput);
    copied.value = true;
    window.setTimeout(() => { copied.value = false; }, 1200);
  } catch { /* clipboard unavailable */ }
}

function downloadCurrent() {
  const url = URL.createObjectURL(store.outputBlob());
  const a = document.createElement('a');
  a.href = url;
  a.download = store.outputFileName;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAs(format: string) {
  const name = `image_${store.width}x${store.height}`;
  const result = buildExport(format, {
    name,
    source: store.cArrayOutput,
    bytes: Array.from(store.byteOutput),
    width: store.width,
    height: store.height
  });
  downloadExport(name, result);
}

onMounted(() => {
  render();
  renderPreview();
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));

watch(
  () => [store.pixels, store.showGrid, store.zoom, store.width, store.height],
  () => nextTick(() => { render(); renderPreview(); }),
  { deep: true }
);
</script>

<template>
  <div class="tool-page">
    <div class="tool-toolbar">
      <span class="tool-title">✎ Pixel Editor</span>
      <div class="btn-group">
        <button
          v-for="tool in TOOLS"
          :key="tool.key"
          class="btn sm icon"
          :class="{ toggled: store.activeTool === tool.key }"
          :title="`${tool.label} (${tool.shortcut})`"
          :data-test="`tool-${tool.key}`"
          @click="store.setTool(tool.key)"
        >{{ tool.icon }}</button>
      </div>
      <span class="divider-v"></span>
      <div class="btn-group">
        <button class="btn sm" :disabled="!store.canUndo" title="Undo (Ctrl+Z)" @click="store.undo()">↶ Undo</button>
        <button class="btn sm" :disabled="!store.canRedo" title="Redo (Ctrl+Y)" @click="store.redo()">↷ Redo</button>
        <button class="btn sm danger" @click="store.clearCanvas()">✕ Clear</button>
      </div>
      <span class="divider-v"></span>
      <label class="inline-field">
        Canvas
        <select :value="store.width" @change="store.setCanvasSize(Number(($event.target as HTMLSelectElement).value))">
          <option :value="16">16×16</option>
          <option :value="32">32×32</option>
          <option :value="64">64×64</option>
        </select>
      </label>
      <label class="inline-field">
        Zoom
        <input v-model.number="store.zoom" type="number" min="200" max="1600" step="100" />
      </label>
      <label class="check"><input v-model="store.showGrid" type="checkbox" /> Grid</label>
      <span class="toolbar-spacer"></span>
      <span class="cursor-status">X: {{ store.cursorX }} · Y: {{ store.cursorY }} · {{ store.width }}×{{ store.height }}</span>
    </div>

    <div class="tool-main">
      <Panel title="Canvas">
        <div class="pixel-stage">
          <canvas
            ref="canvas"
            class="pixel-canvas"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointerleave="onPointerUp"
            @contextmenu.prevent
          />
        </div>
      </Panel>
    </div>

    <aside class="tool-side">
      <Panel title="Color">
        <div class="field-stack">
          <div class="color-current">
            <input v-model="store.activeColor" type="color" />
            <span>{{ store.activeColor }}</span>
          </div>
          <div class="palette-row">
            <button
              v-for="color in store.palette"
              :key="color"
              class="swatch"
              :class="{ active: store.activeColor === color }"
              :style="{ backgroundColor: color }"
              :title="color"
              @click="store.activeColor = color"
            />
            <button class="swatch add" title="Add color" @click="colorInput?.click()">＋</button>
            <input ref="colorInput" type="color" class="hidden-input" @change="addPaletteColor" />
          </div>
        </div>
      </Panel>

      <Panel title="Brush">
        <div class="field-stack">
          <label class="field">
            <span>Brush Size</span>
            <select v-model.number="store.brushSize">
              <option :value="1">1 px</option>
              <option :value="2">2 px</option>
              <option :value="3">3 px</option>
              <option :value="4">4 px</option>
            </select>
          </label>
          <label class="check"><input v-model="store.symmetry" type="checkbox" /> Mirror symmetry</label>
        </div>
      </Panel>

      <Panel title="Preview">
        <div class="canvas-frame light" style="min-height:120px">
          <canvas ref="previewCanvas"></canvas>
        </div>
      </Panel>

      <Panel title="Encoding">
        <div class="field-stack">
          <label class="field">
            <span>Scan Direction</span>
            <select v-model="store.scanDirection" data-test="handdraw-scan">
              <option value="horizontal-ltr">Left → Right, Top → Bottom</option>
              <option value="horizontal-rtl">Right → Left, Top → Bottom</option>
              <option value="vertical-ttb">Top → Bottom, Left → Right</option>
              <option value="vertical-btt">Bottom → Top, Left → Right</option>
            </select>
          </label>
          <div class="field-row">
            <label class="field">
              <span>Bit Order</span>
              <select v-model="store.bitOrder">
                <option value="msb">MSB First</option>
                <option value="lsb">LSB First</option>
              </select>
            </label>
            <label class="field">
              <span>Polarity</span>
              <select v-model="store.polarity">
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </label>
          </div>
        </div>
      </Panel>
    </aside>

    <div class="tool-output">
      <section class="code-panel" data-test="code-output">
        <header class="code-head">
          <span class="code-title">Output</span>
          <span class="code-meta">{{ store.byteOutput.length }} bytes · {{ store.width }}×{{ store.height }}</span>
          <div class="panel-actions">
            <select
              v-model="store.outputFormat"
              data-test="handdraw-output-format"
              style="height:28px;border-radius:6px;border:1px solid #37404e;background:transparent;color:#b6c0d0;font-size:12px"
            >
              <option value="c-array">C Array</option>
              <option value="hex">HEX Bytes</option>
              <option value="bin">Binary (.bin)</option>
            </select>
            <button class="code-btn" @click="copyOutput">{{ copied ? '✓ Copied' : '⧉ Copy' }}</button>
            <button class="code-btn accent" @click="downloadCurrent">⇩ {{ store.outputFileName }}</button>
          </div>
        </header>
        <pre class="code-body"><code>{{ store.currentOutput }}</code></pre>
        <footer class="code-foot">
          <span class="foot-label">Export as</span>
          <button class="code-btn" @click="exportAs('h')">.h</button>
          <button class="code-btn" @click="exportAs('txt')">.txt</button>
          <button class="code-btn" @click="exportAs('md')">.md</button>
          <button class="code-btn" @click="exportAs('py')">.py</button>
          <button class="code-btn" @click="exportAs('json')">.json</button>
        </footer>
      </section>
    </div>
  </div>
</template>
