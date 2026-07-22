<script setup lang="ts">
import { computed, ref } from 'vue';
import BeadTabs from '../features/bead/components/BeadTabs.vue';
import LeftSidebar from '../features/bead/components/LeftSidebar.vue';
import RightSidebar from '../features/bead/components/RightSidebar.vue';
import BeadDualPreview from '../features/bead/components/BeadDualPreview.vue';
import DrawTab from '../features/bead/components/DrawTab.vue';
import FreeCanvasTab from '../features/bead/components/FreeCanvasTab.vue';
import { useBeadPatternStore } from '../features/bead/stores/beadPatternStore';
import { exportPng, exportJpeg, exportPrint, exportCsv, exportJson } from '../features/bead/exportUtils';
import { getBrand, getSymbol } from '../features/bead/paletteData';
import type { PatternResult, MaterialItem } from '../features/bead/types';
import { t } from '../i18n';

// ── Convert DrawPattern to PatternResult for export ──
function drawToPatternResult(cells: (string | null)[], w: number, h: number, brandId: string): PatternResult {
  const brand = getBrand(brandId as any);
  const counts = new Map<string, number>();
  const grid: (PatternResult['cells'])[0][] = [];
  for (let r = 0; r < h; r++) {
    const row: PatternResult['cells'][0] = [];
    for (let c = 0; c < w; c++) {
      const code = cells[r * w + c];
      if (!code) { row.push(null); continue; }
      const bead = brand.colors.find((bc) => bc.code === code) ?? null;
      if (bead) counts.set(code, (counts.get(code) ?? 0) + 1);
      row.push({
        row: r, col: c, bead, symbol: ''
      });
    }
    grid.push(row);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const materials: MaterialItem[] = [];
  let idx = 0;
  for (const [code, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    const bead = brand.colors.find((bc) => bc.code === code);
    if (!bead) continue;
    materials.push({ bead, count, percentage: total > 0 ? (count / total) * 100 : 0, symbol: getSymbol(idx++) });
  }
  // Assign symbols to cells
  const codeToSym = new Map(materials.map((m) => [m.bead.code, m.symbol]));
  for (const row of grid) for (const cell of row) { if (cell?.bead) cell.symbol = codeToSym.get(cell.bead.code) ?? ''; }
  const perBoard = store.boardSize * store.boardSize;
  return {
    width: w, height: h, cells: grid, materials, totalBeads: total,
    boardCount: perBoard > 0 ? Math.ceil(total / perBoard) : 0,
    boardSize: store.boardSize, brandId: brandId as any
  };
}

const store = useBeadPatternStore();
const activeTab = ref<'image' | 'draw' | 'canvas'>('image');
const fileInput = ref<HTMLInputElement | null>(null);

// ── Per-tab data for export ──
const drawMaterials = ref<any[]>([]);
const drawTotalBeads = ref(0);
const canvasMaterials = ref<any[]>([]);
const canvasTotalBeads = ref(0);

function onCanvasDataUpdate(data: { materials: any[]; totalBeads: number }) {
  canvasMaterials.value = data.materials;
  canvasTotalBeads.value = data.totalBeads;
}

// ── Active tab export data ──
const activeMaterials = computed(() => {
  if (activeTab.value === 'image') return store.materials;
  if (activeTab.value === 'draw') return drawMaterials.value;
  return canvasMaterials.value;
});

const activeTotalBeads = computed(() => {
  if (activeTab.value === 'image') return store.totalBeads;
  if (activeTab.value === 'draw') return drawTotalBeads.value;
  return canvasTotalBeads.value;
});

const activeGridSize = computed(() => {
  if (activeTab.value === 'image') return `${store.gridWidth}×${store.gridHeight}`;
  if (activeTab.value === 'draw') return 'Draw';
  return 'Canvas';
});

function pickFile() { fileInput.value?.click(); }

async function loadFile(file: File) {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Unable to decode image'));
      img.src = dataUrl;
    });
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.canvas.width = img.naturalWidth;
    ctx.canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    store.loadImage({
      fileName: file.name,
      width: img.naturalWidth,
      height: img.naturalHeight,
      size: file.size,
      imageData: ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight),
      dataUrl
    });
  } catch { /* ignore */ }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) loadFile(file);
}

function handleExportPng() {
  const p = getActivePattern();
  if (p) exportPng(p, store.patternTitle || undefined);
}
function handleExportJpeg() {
  const p = getActivePattern();
  if (p) exportJpeg(p, store.patternTitle || undefined);
}
function handleExportPrint() {
  const p = getActivePattern();
  if (p) exportPrint(p, store.patternTitle || undefined);
}
function handleExportCsv() {
  const p = getActivePattern();
  if (p) exportCsv(p, store.patternTitle || undefined);
}
function handleExportJson() {
  const p = getActivePattern();
  if (p) exportJson(p, store.patternTitle || undefined);
}

// ── Get pattern for current active tab ──
const drawCells = ref<(string | null)[]>([]);
const drawW = ref(0);
const drawH = ref(0);
const canvasPattern = ref<PatternResult | null>(null);

function onDrawDataUpdate(data: { materials: MaterialItem[]; totalBeads: number; cells: (string | null)[]; width: number; height: number }) {
  drawMaterials.value = data.materials;
  drawTotalBeads.value = data.totalBeads;
  drawCells.value = data.cells;
  drawW.value = data.width;
  drawH.value = data.height;
}

function onCanvasPatternUpdate(data: { pattern: PatternResult | null }) {
  canvasPattern.value = data.pattern;
}

function getActivePattern(): PatternResult | null {
  if (activeTab.value === 'image') return store.pattern;
  if (activeTab.value === 'draw' && drawCells.value.length > 0) {
    return drawToPatternResult(drawCells.value, drawW.value, drawH.value, store.brandId);
  }
  if (activeTab.value === 'canvas') return canvasPattern.value;
  return null;
}
</script>

<template>
  <div class="bead-layout">
    <!-- ① Top bar: tab switching + file open -->
    <header class="bead-topbar">
      <BeadTabs :activeTab="activeTab" @update:activeTab="(v: any) => activeTab = v" />
      <div class="bead-topbar-right">
        <button class="btn primary sm" @click="pickFile">{{ t('bead.open') }}</button>
        <button class="btn sm" :disabled="!store.hasImage" @click="store.reset()">{{ t('common.reset') }}</button>
        <span v-if="store.hasImage" class="toolbar-info">{{ store.fileName }}</span>
      </div>
      <input ref="fileInput" type="file" class="hidden-input" accept="image/png,image/jpeg,image/webp,image/bmp" @change="onFileChange" />
    </header>

    <!-- ② Left sidebar: materials -->
    <aside class="bead-col-left">
      <LeftSidebar :materials="activeMaterials" :totalBeads="activeTotalBeads" />
    </aside>

    <!-- ③ Center: main workspace -->
    <main class="bead-col-center">
      <BeadDualPreview v-if="activeTab === 'image'" />
      <DrawTab v-else-if="activeTab === 'draw'" @data-update="onDrawDataUpdate" />
      <FreeCanvasTab v-else @data-update="onCanvasDataUpdate" @pattern-update="onCanvasPatternUpdate" />
    </main>

    <!-- ④ Right sidebar: parameters -->
    <aside class="bead-col-right">
      <RightSidebar />
    </aside>

    <!-- ⑤ Bottom bar: export -->
    <footer class="bead-bottombar" v-if="activeTotalBeads > 0">
      <span class="bead-bottombar-label">{{ t('bead.export') }}</span>
      <span class="bead-bottombar-info">{{ activeGridSize }} · {{ activeTotalBeads }} {{ t('bead.drawBeads') }} · {{ activeMaterials.length }} {{ t('bead.drawColors') }}</span>
      <span class="divider-v"></span>
      <button class="btn sm" @click="handleExportPng">PNG</button>
      <button class="btn sm" @click="handleExportJpeg">JPEG</button>
      <button class="btn sm accent" @click="handleExportPrint">{{ t('bead.exportPdf') }}</button>
      <span class="divider-v"></span>
      <button class="btn sm" @click="handleExportCsv">CSV {{ t('bead.materials') }}</button>
      <button class="btn sm" @click="handleExportJson">JSON</button>
      <span class="toolbar-spacer"></span>
      <span class="bead-bottombar-hint">{{ t('bead.exportHint') }}</span>
    </footer>
  </div>
</template>
