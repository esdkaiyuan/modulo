<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import PresetPicker from './PresetPicker.vue';
import { useBeadPatternStore } from '../stores/beadPatternStore';
import { renderPattern } from '../patternRenderer';
import { getPresetById } from '../presets';
import { getBrand, getSymbol } from '../paletteData';
import { t } from '../../../i18n';
import type { MaterialItem, PatternResult } from '../types';
import type { CanvasObject } from '../canvasObjects';

const emit = defineEmits<{
  (e: 'dataUpdate', data: { materials: MaterialItem[]; totalBeads: number }): void;
  (e: 'patternUpdate', data: { pattern: PatternResult | null }): void;
}>();

const beadStore = useBeadPatternStore();
const draggingId = ref<string | null>(null);
const dragStart = ref({ x: 0, y: 0 });
const dragObjStart = ref({ x: 0, y: 0 });
const showPresets = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// ── Canvas = bead grid × bead px (always unified, no manual canvas size) ──
const beadGridW = ref(40);
const beadGridH = ref(30);
const beadPx = ref(20);

// Canvas size is ALWAYS derived — never set independently
const canvasW = computed(() => beadGridW.value * beadPx.value);
const canvasH = computed(() => beadGridH.value * beadPx.value);

function onGridWChange() {
  beadGridW.value = Math.max(4, Math.min(200, Math.round(beadGridW.value)));
  scheduleComposite();
}
function onGridHChange() {
  beadGridH.value = Math.max(4, Math.min(200, Math.round(beadGridH.value)));
  scheduleComposite();
}
function onBeadPxChange() {
  beadPx.value = Math.max(4, Math.min(40, Math.round(beadPx.value)));
}
const objects = ref<CanvasObject[]>([]);
const selectedId = ref<string | null>(null);
const gridSize = ref(20);
let nextZ = 1;

const selected = computed(() => objects.value.find((o) => o.id === selectedId.value) ?? null);

// ── Add pattern from Image/Draw tab ──
function addPattern() {
  if (!beadStore.pattern) return;
  const p = beadStore.pattern;
  const cs = Math.min(12, Math.floor(400 / Math.max(p.width, p.height)));
  const rendered = renderPattern(p, { cellSize: cs, showGrid: true, showCoordinates: false, showBoardLines: false, showLegend: false, title: '' });
  const cells: (string | null)[] = [];
  for (let r = 0; r < p.height; r++)
    for (let c = 0; c < p.width; c++)
      cells.push(p.cells[r]?.[c]?.bead?.code ?? null);

  objects.value.push({
    id: `obj-${nextZ++}`, type: 'pattern',
    x: 40, y: 40, width: p.width * cs, height: p.height * cs,
    rotation: 0, scale: 1, selected: false, zIndex: nextZ++,
    patternData: { width: p.width, height: p.height, cells, brandId: p.brandId },
    imageDataUrl: rendered.toDataURL('image/png')
  });
}

// ── Import original image file ──
function pickFile() { fileInput.value?.click(); }

async function importImageFile(file: File) {
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
  // Scale to fit canvas (max 400px on longest side)
  const maxDim = 400;
  const ratio = img.naturalWidth / img.naturalHeight;
  let w: number, h: number;
  if (ratio >= 1) { w = maxDim; h = Math.round(maxDim / ratio); }
  else { h = maxDim; w = Math.round(maxDim * ratio); }

  objects.value.push({
    id: `obj-${nextZ++}`, type: 'image',
    x: 60 + Math.random() * 100, y: 60 + Math.random() * 100,
    width: w, height: h,
    rotation: 0, scale: 1, selected: false, zIndex: nextZ++,
    imageDataUrl: dataUrl
  });
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) importImageFile(file).catch(() => {});
}

// ── Add preset: render as high-res image for accurate color sampling ──
function addPreset(presetId: string) {
  const preset = getPresetById(presetId);
  if (!preset) return;

  // Render emoji at high resolution (200×200)
  const res = 200;
  const offscreen = document.createElement('canvas');
  offscreen.width = res;
  offscreen.height = res;
  const ctx = offscreen.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, res, res);
  ctx.font = `${res * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(preset.char, res / 2, res / 2);
  const dataUrl = offscreen.toDataURL('image/png');

  objects.value.push({
    id: `obj-${nextZ++}`, type: 'preset',
    x: 100 + Math.random() * 200, y: 100 + Math.random() * 100,
    width: 80, height: 80, rotation: 0, scale: 1, selected: false, zIndex: nextZ++,
    presetId: preset.id, presetChar: preset.char, presetColor: '#18202e',
    imageDataUrl: dataUrl
  });
  showPresets.value = false;
}

// ── Object manipulation ──
function selectObj(id: string | null) {
  selectedId.value = id;
  objects.value = objects.value.map((o) => ({ ...o, selected: o.id === id }));
}
function deleteObj(id: string) { objects.value = objects.value.filter((o) => o.id !== id); if (selectedId.value === id) selectedId.value = null; }
function rotateObj(id: string, deg: number) { objects.value = objects.value.map((o) => o.id === id ? { ...o, rotation: (o.rotation + deg + 360) % 360 } : o); }
function scaleObj(id: string, f: number) { objects.value = objects.value.map((o) => o.id === id ? { ...o, scale: Math.max(0.2, Math.min(5, o.scale * f)) } : o); }
function bringForward(id: string) { const mz = Math.max(0, ...objects.value.map((o) => o.zIndex)); objects.value = objects.value.map((o) => o.id === id ? { ...o, zIndex: mz + 1 } : o); }
function sendBackward(id: string) { const mz = Math.min(0, ...objects.value.map((o) => o.zIndex)); objects.value = objects.value.map((o) => o.id === id ? { ...o, zIndex: Math.min(0, mz - 1) } : o); }
function clearAll() { objects.value = []; selectedId.value = null; compositeAndConvert(); }

// ── Composite all objects into one image, then convert to beads ──
function compositeAndConvert() {
  if (objects.value.length === 0) {
    emit('dataUpdate', { materials: [], totalBeads: 0 });
    emit('patternUpdate', { pattern: null });
    return;
  }

  // Create offscreen canvas at canvas size
  const offscreen = document.createElement('canvas');
  offscreen.width = canvasW.value;
  offscreen.height = canvasH.value;
  const ctx = offscreen.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW.value, canvasH.value);

  // Render all objects sorted by z-index
  const sorted = [...objects.value].sort((a, b) => a.zIndex - b.zIndex);
  const imagePromises: Promise<void>[] = [];

  for (const obj of sorted) {
    if (obj.imageDataUrl) {
      // Pattern/image object: load and draw
      const p = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          const cx = obj.x + (obj.width * obj.scale) / 2;
          const cy = obj.y + (obj.height * obj.scale) / 2;
          ctx.translate(cx, cy);
          ctx.rotate((obj.rotation * Math.PI) / 180);
          ctx.scale(obj.scale, obj.scale);
          ctx.drawImage(img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = obj.imageDataUrl || '';
      });
      imagePromises.push(p);
    } else if (obj.presetChar) {
      // Preset: render bead-dot grid filling the entire object area
      const displayW = obj.width * obj.scale;
      const displayH = obj.height * obj.scale;
      const cols = Math.max(3, Math.round(displayW / 8));
      const rows = Math.max(3, Math.round(displayH / 8));
      const beadSize = displayW / cols;
      const beadRadius = beadSize * 0.42;
      const colorMap: Record<string, string> = {
        '😊': '#FFD600', '❤️': '#E53935', '⭐': '#FFD600', '🔥': '#FF6D00',
        '👍': '#FFB74D', '👏': '#FFCC80', '😢': '#42A5F5', '😂': '#FFD54F',
        '😎': '#5C6BC0', '♥': '#E53935', '★': '#FFD600', '◆': '#42A5F5',
        '●': '#4CAF50', '■': '#FF9800', '▲': '#9C27B0', '♠': '#212121',
        '♣': '#2E7D32', '♦': '#F44336', '♪': '#9C27B0'
      };
      const beadColor = colorMap[obj.presetChar] || '#5C6BC0';

      ctx.save();
      const cx = obj.x + (obj.width * obj.scale) / 2;
      const cy = obj.y + (obj.height * obj.scale) / 2;
      ctx.translate(cx, cy);
      ctx.rotate((obj.rotation * Math.PI) / 180);
      ctx.scale(obj.scale, obj.scale);

      const gridW = cols * beadSize;
      const gridH = rows * beadSize;
      const ox = -gridW / 2;
      const oy = -gridH / 2;

      const shapes: Record<string, number[][]> = {
        circle: [[0,1,1,1,0],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0]],
        heart: [[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]],
        star: [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,1,0,1,0]],
        diamond: [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]],
        square: [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]],
        triangle: [[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]]
      };
      let shape = shapes.circle;
      if ('❤♥♡'.includes(obj.presetChar)) shape = shapes.heart;
      else if ('★☆'.includes(obj.presetChar)) shape = shapes.star;
      else if ('◆◇♦'.includes(obj.presetChar)) shape = shapes.diamond;
      else if ('■□'.includes(obj.presetChar)) shape = shapes.square;
      else if ('▲△'.includes(obj.presetChar)) shape = shapes.triangle;

      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          if (!shape[r]?.[c]) continue;
          ctx.fillStyle = beadColor;
          ctx.beginPath();
          ctx.arc(ox + c * beadSize + beadSize / 2, oy + r * beadSize + beadSize / 2, beadRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      ctx.restore();
    }
  }

  // After all images load, sample and convert to beads
  Promise.all(imagePromises).then(() => {
    const gw = beadGridW.value, gh = beadGridH.value;
    const brand = getBrand(beadStore.brandId);

    // Sample the composited image at bead-grid resolution
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = gw;
    sampleCanvas.height = gh;
    const sctx = sampleCanvas.getContext('2d')!;
    sctx.drawImage(offscreen, 0, 0, gw, gh);
    const imageData = sctx.getImageData(0, 0, gw, gh);

    // Match each sample to closest bead color
    const cells: (string | null)[] = [];
    const counts = new Map<string, number>();

    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = (y * gw + x) * 4;
        const r = imageData.data[i], g = imageData.data[i + 1], b = imageData.data[i + 2], a = imageData.data[i + 3];
        if (a < 128 || (r === 255 && g === 255 && b === 255)) {
          cells.push(null);
          continue;
        }
        // Find closest bead color
        let bestCode = brand.colors[0].code;
        let bestDist = Infinity;
        for (const bead of brand.colors) {
          const dr = r - bead.r, dg = g - bead.g, db = b - bead.b;
          const dist = dr * dr + dg * dg + db * db;
          if (dist < bestDist) { bestDist = dist; bestCode = bead.code; }
        }
        cells.push(bestCode);
        counts.set(bestCode, (counts.get(bestCode) ?? 0) + 1);
      }
    }

    // Build materials
    const total = cells.filter(Boolean).length;
    const materials: MaterialItem[] = [];
    let idx = 0;
    for (const [code, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      const bead = brand.colors.find((c) => c.code === code);
      if (!bead) continue;
      materials.push({ bead, count, percentage: total > 0 ? (count / total) * 100 : 0, symbol: getSymbol(idx++) });
    }

    // Build PatternResult
    const grid: (PatternResult['cells'])[0][] = [];
    const codeToSym = new Map(materials.map((m) => [m.bead.code, m.symbol]));
    for (let y = 0; y < gh; y++) {
      const row: PatternResult['cells'][0] = [];
      for (let x = 0; x < gw; x++) {
        const code = cells[y * gw + x];
        if (!code) { row.push(null); continue; }
        const bead = brand.colors.find((c) => c.code === code) ?? null;
        row.push({ row: y, col: x, bead, symbol: codeToSym.get(code) ?? '' });
      }
      grid.push(row);
    }

    const perBoard = beadStore.boardSize * beadStore.boardSize;
    const patternResult: PatternResult = {
      width: gw, height: gh, cells: grid, materials, totalBeads: total,
      boardCount: perBoard > 0 ? Math.ceil(total / perBoard) : 0,
      boardSize: beadStore.boardSize, brandId: beadStore.brandId
    };

    emit('dataUpdate', { materials, totalBeads: total });
    emit('patternUpdate', { pattern: patternResult });
  });
}

// ── Drag handling ──
function onStageMouseDown(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('[data-obj-id]') as HTMLElement | null;
  if (target) {
    const id = target.dataset.objId!;
    selectObj(id);
    draggingId.value = id;
    dragStart.value = { x: e.clientX, y: e.clientY };
    const obj = objects.value.find((o) => o.id === id);
    if (obj) dragObjStart.value = { x: obj.x, y: obj.y };
    e.preventDefault();
  } else { selectObj(null); }
}
function onStageMouseMove(e: MouseEvent) {
  if (!draggingId.value) return;
  const dx = e.clientX - dragStart.value.x, dy = e.clientY - dragStart.value.y;
  objects.value = objects.value.map((o) => o.id === draggingId.value ? { ...o, x: dragObjStart.value.x + dx, y: dragObjStart.value.y + dy } : o);
}
function onStageMouseUp() { draggingId.value = null; }

// ── Keyboard ──
function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  const s = selected.value;
  if (!s) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteObj(s.id); return; }
  const step = e.shiftKey ? gridSize.value : 1;
  if (e.key === 'ArrowLeft') { e.preventDefault(); objects.value = objects.value.map((o) => o.id === s.id ? { ...o, x: o.x - step } : o); }
  if (e.key === 'ArrowRight') { e.preventDefault(); objects.value = objects.value.map((o) => o.id === s.id ? { ...o, x: o.x + step } : o); }
  if (e.key === 'ArrowUp') { e.preventDefault(); objects.value = objects.value.map((o) => o.id === s.id ? { ...o, y: o.y - step } : o); }
  if (e.key === 'ArrowDown') { e.preventDefault(); objects.value = objects.value.map((o) => o.id === s.id ? { ...o, y: o.y + step } : o); }
  if (e.key === 'r' || e.key === 'R') rotateObj(s.id, e.shiftKey ? -15 : 15);
  if (e.key === '+' || e.key === '=') scaleObj(s.id, 1.1);
  if (e.key === '-') scaleObj(s.id, 0.9);
}

// Re-composite when objects change (debounced)
let compositeTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleComposite() {
  if (compositeTimer) clearTimeout(compositeTimer);
  compositeTimer = setTimeout(() => { compositeTimer = null; compositeAndConvert(); }, 200);
}

watch(() => objects.value.length, () => scheduleComposite());
watch(() => objects.value.map((o) => `${o.x},${o.y},${o.rotation},${o.scale}`), () => scheduleComposite());

onMounted(() => { window.addEventListener('keydown', onKeyDown); compositeAndConvert(); });
onBeforeUnmount(() => { window.removeEventListener('keydown', onKeyDown); if (compositeTimer) clearTimeout(compositeTimer); });
</script>

<template>
  <div class="canvas-page">
    <div class="canvas-toolbar">
      <button class="btn sm" @click="pickFile()">{{ t('bead.importImage') }}</button>
      <button class="btn sm primary" :disabled="!beadStore.pattern" @click="addPattern()">{{ t('bead.addPattern') }}</button>
      <button class="btn sm" :class="{ toggled: showPresets }" @click="showPresets = !showPresets">{{ t('bead.addPreset') }}</button>
      <span class="divider-v"></span>
      <label class="draw-check">{{ t('bead.beadGrid') }}</label>
      <input v-model.number="beadGridW" type="number" min="4" max="200" class="canvas-grid-input" @change="onGridWChange()" />
      <span class="draw-check">×</span>
      <input v-model.number="beadGridH" type="number" min="4" max="200" class="canvas-grid-input" @change="onGridHChange()" />
      <span class="draw-check">px</span>
      <input v-model.number="beadPx" type="number" min="4" max="40" class="canvas-grid-input" @change="onBeadPxChange()" />
      <span class="draw-check">= {{ canvasW }}×{{ canvasH }}</span>
      <span class="toolbar-spacer"></span>
      <button class="btn sm danger" @click="clearAll()">{{ t('bead.drawClear') }}</button>
    </div>

    <div v-if="showPresets" class="canvas-preset-bar">
      <PresetPicker @select="addPreset" @close="showPresets = false" />
    </div>

    <div class="canvas-stage"
      @mousedown="onStageMouseDown"
      @mousemove="onStageMouseMove"
      @mouseup="onStageMouseUp"
      @mouseleave="onStageMouseUp">
      <div class="canvas-grid-bg" :style="{ width: canvasW + 'px', height: canvasH + 'px' }">
        <div
          v-for="obj in [...objects].sort((a, b) => a.zIndex - b.zIndex)"
          :key="obj.id"
          :data-obj-id="obj.id"
          class="canvas-obj"
          :class="{ selected: obj.id === selectedId }"
          :style="{
            left: obj.x + 'px', top: obj.y + 'px',
            width: obj.width * obj.scale + 'px', height: obj.height * obj.scale + 'px',
            transform: `rotate(${obj.rotation}deg)`, zIndex: obj.zIndex
          }">
          <img v-if="obj.imageDataUrl" :src="obj.imageDataUrl" draggable="false" style="width:100%;height:100%;image-rendering:pixelated;pointer-events:none" />
          <div v-else-if="obj.presetChar" class="canvas-preset-char" :style="{ color: obj.presetColor || '#18202e' }">{{ obj.presetChar }}</div>
          <div v-if="obj.id === selectedId" class="canvas-obj-frame">
            <div class="canvas-corner tl"></div>
            <div class="canvas-corner tr"></div>
            <div class="canvas-corner bl"></div>
            <div class="canvas-corner br"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selected" class="canvas-obj-bar">
      <span class="canvas-obj-label">{{ selected.presetChar || '▣ Pattern' }}</span>
      <span class="canvas-obj-pos">X:{{ Math.round(selected.x) }} Y:{{ Math.round(selected.y) }}</span>
      <span class="canvas-obj-pos">R:{{ Math.round(selected.rotation) }}° S:{{ selected.scale.toFixed(1) }}x</span>
      <span class="divider-v"></span>
      <button class="btn sm" @click="rotateObj(selected.id, -15)">↶15°</button>
      <button class="btn sm" @click="rotateObj(selected.id, 15)">↷15°</button>
      <button class="btn sm" @click="rotateObj(selected.id, -selected.rotation)">↺0°</button>
      <span class="divider-v"></span>
      <button class="btn sm" @click="scaleObj(selected.id, 1.2)">＋</button>
      <button class="btn sm" @click="scaleObj(selected.id, 0.8)">－</button>
      <span class="divider-v"></span>
      <button class="btn sm" @click="bringForward(selected.id)">↑</button>
      <button class="btn sm" @click="sendBackward(selected.id)">↓</button>
      <span class="divider-v"></span>
      <button class="btn sm danger" @click="deleteObj(selected.id)">✕</button>
    </div>

    <div class="canvas-statusbar">
      <span>{{ objects.length }} {{ t('bead.objects', { n: objects.length }) }}</span>
      <span class="toolbar-spacer"></span>
      <span class="canvas-hint">←→↑↓ 移动 · R 旋转 · +/- 缩放 · Del 删除</span>
    </div>

    <input ref="fileInput" type="file" class="hidden-input" accept="image/png,image/jpeg,image/webp,image/bmp" @change="onFileChange" />
  </div>
</template>
