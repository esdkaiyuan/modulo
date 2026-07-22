<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useBeadPatternStore } from '../stores/beadPatternStore';
import { getBrand, getSymbol } from '../paletteData';
import { createDrawPattern, cloneDrawPattern, getDrawCell, setDrawCell, type DrawPattern } from '../drawPattern';
import { findClosestBead } from '../patternEngine';
import { t } from '../../../i18n';
import type { MessageKey } from '../../../i18n/messages';
import type { MaterialItem } from '../types';

const emit = defineEmits<{
  (e: 'dataUpdate', data: { materials: MaterialItem[]; totalBeads: number; cells: (string | null)[]; width: number; height: number }): void;
}>();

const store = useBeadPatternStore();
const wrapRef = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

// ── Tool state ──
type DrawTool = 'pencil' | 'eraser' | 'fill' | 'eyedropper';
const tool = ref<DrawTool>('pencil');
const beadCode = ref<string | null>(null);
const isDrawing = ref(false);

// ── Pattern data ──
const pattern = ref<DrawPattern>(createDrawPattern(29, 29));
const history = ref<DrawPattern[]>([]);
const histIdx = ref(-1);
const canUndo = computed(() => histIdx.value > 0);
const canRedo = computed(() => histIdx.value < history.value.length - 1);

// ── View ──
const cellPx = ref(16);
const showGrid = ref(true);
const showCoords = ref(true);

// ── Derived ──
const brand = computed(() => getBrand(store.brandId));
const palette = computed(() => brand.value.colors);
const activeBead = computed(() => palette.value.find((c) => c.code === beadCode.value) ?? null);
const W = computed(() => pattern.value.width);
const H = computed(() => pattern.value.height);
const beadCount = computed(() => pattern.value.cells.filter(Boolean).length);
const usedColors = computed(() => new Set(pattern.value.cells.filter(Boolean)).size);
const gridPxW = computed(() => W.value * cellPx.value);
const gridPxH = computed(() => H.value * cellPx.value);

// ── Draw独立物料计算 ──
const drawMaterials = computed(() => {
  const brand_ = getBrand(store.brandId);
  const counts = new Map<string, number>();
  for (const code of pattern.value.cells) {
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const total = pattern.value.cells.filter(Boolean).length;
  const items: MaterialItem[] = [];
  let idx = 0;
  for (const [code, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    const bead = brand_.colors.find((c) => c.code === code);
    if (!bead) continue;
    items.push({ bead, count, percentage: total > 0 ? (count / total) * 100 : 0, symbol: getSymbol(idx++) });
  }
  return items;
});

const drawTotalBeads = computed(() => pattern.value.cells.filter(Boolean).length);

// ── Sync to store ──
function syncToStore() {
  store.applyDrawCells([...pattern.value.cells], W.value, H.value);
  emit('dataUpdate', {
    materials: drawMaterials.value,
    totalBeads: drawTotalBeads.value,
    cells: [...pattern.value.cells],
    width: W.value,
    height: H.value
  });
}

// ── Init from generated pattern ──
function initPattern() {
  if (store.pattern) {
    const p = createDrawPattern(store.pattern.width, store.pattern.height);
    for (let r = 0; r < store.pattern.height; r++)
      for (let c = 0; c < store.pattern.width; c++)
        setDrawCell(p, r, c, store.pattern.cells[r]?.[c]?.bead?.code ?? null);
    pattern.value = p;
  } else if (store.hasImage && store.sourceImageData) {
    const gw = store.gridWidth, gh = store.gridHeight;
    const off = document.createElement('canvas');
    off.width = gw; off.height = gh;
    const ctx = off.getContext('2d')!;
    const tmp = document.createElement('canvas');
    tmp.width = store.sourceImageData.width; tmp.height = store.sourceImageData.height;
    tmp.getContext('2d')!.putImageData(store.sourceImageData, 0, 0);
    ctx.drawImage(tmp, 0, 0, gw, gh);
    const d = ctx.getImageData(0, 0, gw, gh);
    const p = createDrawPattern(gw, gh);
    const colors = palette.value;
    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++) {
        const i = (y * gw + x) * 4;
        if (d.data[i + 3] < 128) continue;
        setDrawCell(p, y, x, findClosestBead(d.data[i], d.data[i + 1], d.data[i + 2], colors).code);
      }
    pattern.value = p;
  } else {
    pattern.value = createDrawPattern(store.gridWidth, store.gridHeight);
  }
  history.value = [cloneDrawPattern(pattern.value)];
  histIdx.value = 0;
  beadCode.value = palette.value[0]?.code ?? null;
  nextTick(() => syncToStore());
}

// ── History ──
function push() {
  history.value = history.value.slice(0, histIdx.value + 1);
  history.value.push(cloneDrawPattern(pattern.value));
  if (history.value.length > 300) history.value.shift();
  histIdx.value = history.value.length - 1;
  syncToStore();
}
function undo() { if (!canUndo.value) return; histIdx.value--; pattern.value = cloneDrawPattern(history.value[histIdx.value]); draw(); }
function redo() { if (!canRedo.value) return; histIdx.value++; pattern.value = cloneDrawPattern(history.value[histIdx.value]); draw(); }

// ── Canvas drawing ──
function draw() {
  const el = canvas.value;
  if (!el) return;
  const cell = cellPx.value;
  const cw = W.value * cell, ch = H.value * cell;
  el.width = cw; el.height = ch;
  const ctx = el.getContext('2d')!;
  const p = pattern.value;
  const cmap = new Map(palette.value.map((c) => [c.code, c.hex]));

  ctx.fillStyle = '#f8f9fb';
  ctx.fillRect(0, 0, cw, ch);

  for (let r = 0; r < H.value; r++) {
    for (let c = 0; c < W.value; c++) {
      const code = getDrawCell(p, r, c);
      const x = c * cell, y = r * cell;
      if (code) {
        ctx.fillStyle = cmap.get(code) ?? '#ccc';
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.42, 0, Math.PI * 2);
        ctx.fill();
      } else if (showGrid.value && cell >= 4) {
        ctx.fillStyle = 'rgba(200,210,220,0.25)';
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (showGrid.value && cell >= 4) {
    ctx.strokeStyle = 'rgba(160,170,180,0.2)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W.value; x++) {
      ctx.beginPath(); ctx.moveTo(x * cell + 0.5, 0); ctx.lineTo(x * cell + 0.5, ch); ctx.stroke();
    }
    for (let y = 0; y <= H.value; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * cell + 0.5); ctx.lineTo(cw, y * cell + 0.5); ctx.stroke();
    }
  }

  if (showCoords.value && cell >= 7) {
    ctx.fillStyle = 'rgba(100,115,135,0.55)';
    ctx.font = `${Math.min(9, cell * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < H.value; r++)
      for (let c = 0; c < W.value; c++) {
        if (getDrawCell(p, r, c)) continue;
        ctx.fillText(`${r + 1},${c + 1}`, c * cell + cell / 2, r * cell + cell / 2);
      }
  }

  syncToStore();
}

// ── Pointer → cell ──
function toCell(e: PointerEvent): [number, number] | null {
  const el = canvas.value;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const c = Math.floor((e.clientX - r.left) / cellPx.value);
  const row = Math.floor((e.clientY - r.top) / cellPx.value);
  if (row < 0 || row >= H.value || c < 0 || c >= W.value) return null;
  return [row, c];
}

function flood(row: number, col: number, nc: string | null) {
  const oc = getDrawCell(pattern.value, row, col);
  if (oc === nc) return;
  const s: [number, number][] = [[row, col]];
  const v = new Set<string>();
  while (s.length) {
    const [r, c] = s.pop()!;
    const k = `${r},${c}`;
    if (v.has(k) || getDrawCell(pattern.value, r, c) !== oc) continue;
    v.add(k);
    setDrawCell(pattern.value, r, c, nc);
    if (r > 0) s.push([r - 1, c]);
    if (r < H.value - 1) s.push([r + 1, c]);
    if (c > 0) s.push([r, c - 1]);
    if (c < W.value - 1) s.push([r, c + 1]);
  }
}

function paint(row: number, col: number) {
  const p = pattern.value;
  if (tool.value === 'eyedropper') { const c = getDrawCell(p, row, col); if (c) beadCode.value = c; return; }
  if (tool.value === 'fill') { flood(row, col, beadCode.value); draw(); return; }
  setDrawCell(p, row, col, tool.value === 'eraser' ? null : beadCode.value);
  draw();
}

function onDown(e: PointerEvent) {
  isDrawing.value = true;
  canvas.value?.setPointerCapture(e.pointerId);
  const cell = toCell(e);
  if (cell) paint(cell[0], cell[1]);
}
function onMove(e: PointerEvent) {
  if (!isDrawing.value || tool.value === 'fill' || tool.value === 'eyedropper') return;
  const cell = toCell(e);
  if (cell) paint(cell[0], cell[1]);
}
function onUp(e: PointerEvent) {
  if (isDrawing.value) {
    isDrawing.value = false;
    canvas.value?.releasePointerCapture(e.pointerId);
    push();
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  cellPx.value = Math.max(4, Math.min(48, cellPx.value + (e.deltaY > 0 ? -1 : 1)));
}

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
  const map: Record<string, DrawTool> = { b: 'pencil', e: 'eraser', g: 'fill', i: 'eyedropper' };
  if (map[e.key.toLowerCase()]) tool.value = map[e.key.toLowerCase()];
  if (e.key === '1') cellPx.value = 8;
  if (e.key === '2') cellPx.value = 14;
  if (e.key === '3') cellPx.value = 20;
  if (e.key === '4') cellPx.value = 28;
}

function clearAll() { pattern.value = createDrawPattern(W.value, H.value); push(); draw(); }
function resize(w: number, h: number) {
  const nw = Math.max(1, Math.min(200, w)), nh = Math.max(1, Math.min(200, h));
  const old = pattern.value;
  const p = createDrawPattern(nw, nh);
  for (let r = 0; r < Math.min(old.height, nh); r++)
    for (let c = 0; c < Math.min(old.width, nw); c++)
      setDrawCell(p, r, c, getDrawCell(old, r, c));
  pattern.value = p; push(); draw();
}

watch(() => [store.pattern, store.brandId, store.sourceImageData], () => { initPattern(); nextTick(draw); }, { deep: true });
watch(() => [cellPx.value, showGrid.value, showCoords.value], () => nextTick(draw));
onMounted(() => { initPattern(); nextTick(draw); window.addEventListener('keydown', onKey); });
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));

const TOOLS: Array<{ key: DrawTool; icon: string; tip: MessageKey; kb: string }> = [
  { key: 'pencil', icon: '✎', tip: 'bead.drawPencil', kb: 'B' },
  { key: 'eraser', icon: '⌫', tip: 'bead.drawEraser', kb: 'E' },
  { key: 'fill', icon: '◉', tip: 'bead.drawFill', kb: 'G' },
  { key: 'eyedropper', icon: '⌖', tip: 'bead.drawPicker', kb: 'I' }
];
</script>

<template>
  <div class="draw-page" ref="wrapRef">
    <div class="draw-toolbar">
      <div class="draw-tools">
        <button v-for="toolItem in TOOLS" :key="toolItem.key" class="draw-tool-btn" :class="{ active: tool === toolItem.key }"
          :title="`${t(toolItem.tip as any)} (${toolItem.kb})`" @click="tool = toolItem.key">{{ toolItem.icon }}</button>
      </div>
      <span class="draw-sep"></span>
      <div class="draw-color-strip">
        <button v-for="c in palette" :key="c.code" class="draw-color-dot"
          :class="{ active: beadCode === c.code }" :style="{ background: c.hex }"
          :title="`${c.code} ${c.name}`" @click="beadCode = c.code" />
      </div>
      <span class="draw-sep"></span>
      <div class="draw-actions">
        <button class="draw-act-btn" :disabled="!canUndo" @click="undo()">↶</button>
        <button class="draw-act-btn" :disabled="!canRedo" @click="redo()">↷</button>
        <button class="draw-act-btn danger" @click="clearAll()">✕</button>
      </div>
      <span class="draw-sep"></span>
      <label class="draw-check"><input type="checkbox" v-model="showGrid" /> {{ t('bead.drawGrid') }}</label>
      <label class="draw-check"><input type="checkbox" v-model="showCoords" /> #</label>
      <span class="toolbar-spacer"></span>
      <div class="draw-zoom">
        <button class="draw-act-btn" @click="cellPx = Math.max(4, cellPx - 2)">−</button>
        <span class="draw-zoom-val">{{ cellPx }}px</span>
        <button class="draw-act-btn" @click="cellPx = Math.min(48, cellPx + 2)">+</button>
      </div>
    </div>

    <div class="draw-canvas-wrap" @wheel.prevent="onWheel">
      <canvas ref="canvas" class="draw-canvas"
        @pointerdown="onDown" @pointermove="onMove"
        @pointerup="onUp" @pointerleave="onUp" @contextmenu.prevent />
    </div>

    <div class="draw-statusbar">
      <span v-if="activeBead" class="draw-status-bead">
        <span class="draw-status-swatch" :style="{ background: activeBead.hex }"></span>
        {{ activeBead.code }} · {{ activeBead.name }}
      </span>
      <span class="draw-status-dim">{{ W }}×{{ H }}</span>
      <span class="draw-status-count">{{ beadCount.toLocaleString() }} {{ t('bead.drawBeads') }}</span>
      <span class="draw-status-colors">{{ usedColors }} {{ t('bead.drawColors') }}</span>
      <span class="toolbar-spacer"></span>
      <span class="draw-status-hint">B 画笔 · E 橡皮 · G 填充 · I 取色 · 1-4 缩放 · Ctrl+Z/Y</span>
    </div>
  </div>
</template>
