import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { generatePattern, findClosestBead } from '../patternEngine';
import { BEAD_BRANDS, getBrand, getSymbol } from '../paletteData';
import type { BeadBrandId, MaterialItem, PatternResult, PatternSettings } from '../types';

export type BeadSizeMode = 'custom' | 'aspect';

export const useBeadPatternStore = defineStore('beadPattern', () => {
  // ── Source image state ──
  const sourceImageData = ref<ImageData | null>(null);
  const sourceDataUrl = ref('');
  const sourceWidth = ref(0);
  const sourceHeight = ref(0);
  const fileName = ref('');
  const fileSize = ref(0);

  // ── Pattern settings ──
  const brandId = ref<BeadBrandId>('artkal-s');
  const sizeMode = ref<BeadSizeMode>('aspect');
  const gridWidth = ref(29);
  const gridHeight = ref(29);
  const aspectLongEdge = ref(29);
  const boardSize = ref(29);
  const viewMode = ref<'colors' | 'symbols' | 'both'>('colors');
  const excludeColors = ref<Set<string>>(new Set());
  const patternTitle = ref('');

  // ── Generated pattern ──
  const pattern = ref<PatternResult | null>(null);
  const isGenerating = ref(false);

  // ── Draw pattern override (from DrawTab) ──
  const drawCells = ref<(string | null)[] | null>(null);
  const drawWidth = ref(0);
  const drawHeight = ref(0);

  // ── Preset objects count (for materials) ──
  const presetCount = ref(0);
  const presetNames = ref<string[]>([]);

  // ── Derived: use drawCells if available, else generated pattern ──
  function computeMaterialsFromCells(cells: (string | null)[], w: number, h: number): MaterialItem[] {
    const brand = getBrand(brandId.value);
    const counts = new Map<string, number>();
    for (const code of cells) {
      if (!code) continue;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    const total = cells.filter(Boolean).length;
    const items: MaterialItem[] = [];
    let idx = 0;
    for (const [code, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
      const bead = brand.colors.find((c) => c.code === code);
      if (!bead) continue;
      items.push({
        bead,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        symbol: getSymbol(idx++)
      });
    }
    return items;
  }

  const materials = computed(() => {
    let items: MaterialItem[] = [];
    if (drawCells.value) {
      items = computeMaterialsFromCells(drawCells.value, drawWidth.value, drawHeight.value);
    } else if (pattern.value) {
      items = pattern.value.materials;
    }
    // Add preset items
    if (presetCount.value > 0) {
      const presetColors: Record<string, { hex: string; name: string }> = {
        'smile': { hex: '#FFD600', name: 'Emoji Smiley' },
        'heart': { hex: '#E53935', name: 'Emoji Heart' },
        'star': { hex: '#FFD600', name: 'Emoji Star' },
        'fire': { hex: '#FF6D00', name: 'Emoji Fire' },
      };
      for (const name of presetNames.value) {
        const info = presetColors[name] || { hex: '#9E9E9E', name: `Preset: ${name}` };
        items.push({
          bead: { code: `PRESET-${name}`, name: info.name, hex: info.hex, r: 0, g: 0, b: 0 },
          count: 1,
          percentage: 0,
          symbol: '★'
        });
      }
    }
    return items;
  });

  const totalBeads = computed(() => {
    let count = drawCells.value ? drawCells.value.filter(Boolean).length : (pattern.value?.totalBeads ?? 0);
    count += presetCount.value;
    return count;
  });

  const boardCount = computed(() => {
    const beads = totalBeads.value;
    const perBoard = boardSize.value * boardSize.value;
    return perBoard > 0 ? Math.ceil(beads / perBoard) : 0;
  });

  /** Compute grid dimensions from aspect mode. */
  function fitToAspect(longEdge: number): { width: number; height: number } {
    const edge = Math.max(1, Math.round(longEdge));
    const sw = sourceWidth.value;
    const sh = sourceHeight.value;
    if (sw <= 0 || sh <= 0) return { width: edge, height: edge };
    if (sw >= sh) {
      return { width: edge, height: Math.max(1, Math.round((edge * sh) / sw)) };
    }
    return { width: Math.max(1, Math.round((edge * sw) / sh)), height: edge };
  }

  function recalcGrid() {
    if (sizeMode.value === 'aspect') {
      const { width, height } = fitToAspect(aspectLongEdge.value);
      gridWidth.value = width;
      gridHeight.value = height;
    }
  }

  let suppressRecalc = false;
  watch([aspectLongEdge, sizeMode], () => {
    if (suppressRecalc) return;
    recalcGrid();
    generate();
  });

  // ── Actions ──
  function loadImage(data: {
    fileName: string;
    width: number;
    height: number;
    size: number;
    imageData: ImageData;
    dataUrl: string;
  }) {
    sourceImageData.value = data.imageData;
    sourceDataUrl.value = data.dataUrl;
    sourceWidth.value = data.width;
    sourceHeight.value = data.height;
    fileName.value = data.fileName;
    fileSize.value = data.size;
    drawCells.value = null; // clear draw override

    suppressRecalc = true;
    sizeMode.value = 'aspect';
    aspectLongEdge.value = 29;
    const { width, height } = fitToAspect(29);
    gridWidth.value = width;
    gridHeight.value = height;
    suppressRecalc = false;

    generate();
  }

  function generate() {
    if (!sourceImageData.value) return;
    isGenerating.value = true;
    drawCells.value = null; // clear draw override when regenerating

    const settings: PatternSettings = {
      brandId: brandId.value,
      gridWidth: gridWidth.value,
      gridHeight: gridHeight.value,
      boardSize: boardSize.value,
      lockAspectRatio: sizeMode.value === 'aspect',
      showSymbols: viewMode.value !== 'colors',
      viewMode: viewMode.value
    };

    requestAnimationFrame(() => {
      pattern.value = generatePattern(sourceImageData.value!, settings, excludeColors.value);
      isGenerating.value = false;
    });
  }

  /** Called by DrawTab to sync its pattern data for materials calculation. */
  function applyDrawCells(cells: (string | null)[], w: number, h: number) {
    drawCells.value = cells;
    drawWidth.value = w;
    drawHeight.value = h;
  }

  function setGridWidth(w: number) {
    const clamped = Math.max(1, Math.min(200, Math.round(w)));
    gridWidth.value = clamped;
    if (sizeMode.value === 'aspect' && sourceWidth.value > 0 && sourceHeight.value > 0) {
      gridHeight.value = Math.max(1, Math.round((clamped * sourceHeight.value) / sourceWidth.value));
    }
    generate();
  }

  function setGridHeight(h: number) {
    const clamped = Math.max(1, Math.min(200, Math.round(h)));
    gridHeight.value = clamped;
    if (sizeMode.value === 'aspect' && sourceWidth.value > 0 && sourceHeight.value > 0) {
      gridWidth.value = Math.max(1, Math.round((clamped * sourceWidth.value) / sourceHeight.value));
    }
    generate();
  }

  function applyOriginalRatio() {
    suppressRecalc = true;
    sizeMode.value = 'aspect';
    const { width, height } = fitToAspect(aspectLongEdge.value);
    gridWidth.value = width;
    gridHeight.value = height;
    suppressRecalc = false;
    generate();
  }

  function setSizeMode(mode: BeadSizeMode) {
    sizeMode.value = mode;
    if (mode === 'aspect') recalcGrid();
    generate();
  }

  function setBrand(id: BeadBrandId) {
    brandId.value = id;
    const b = BEAD_BRANDS.find((br) => br.id === id);
    if (b) boardSize.value = b.defaultBoardSize;
    generate();
  }

  function setBoardSize(size: number) {
    boardSize.value = size;
  }

  function toggleExcludeColor(code: string) {
    const s = new Set(excludeColors.value);
    if (s.has(code)) s.delete(code);
    else s.add(code);
    excludeColors.value = s;
    generate();
  }

  function setViewMode(mode: 'colors' | 'symbols' | 'both') {
    viewMode.value = mode;
  }

  function updatePresets(count: number, names: string[]) {
    presetCount.value = count;
    presetNames.value = names;
  }

  function reset() {
    sourceImageData.value = null;
    sourceDataUrl.value = '';
    sourceWidth.value = 0;
    sourceHeight.value = 0;
    fileName.value = '';
    fileSize.value = 0;
    pattern.value = null;
    drawCells.value = null;
    presetCount.value = 0;
    presetNames.value = [];
    excludeColors.value = new Set();
    patternTitle.value = '';
  }

  return {
    sourceImageData, sourceDataUrl, sourceWidth, sourceHeight,
    fileName, fileSize, brandId, sizeMode, gridWidth, gridHeight,
    aspectLongEdge, boardSize, viewMode, excludeColors, patternTitle,
    pattern, isGenerating, hasImage: computed(() => !!sourceImageData.value),
    brand: computed(() => BEAD_BRANDS.find((b) => b.id === brandId.value) ?? BEAD_BRANDS[0]),
    materials, totalBeads, boardCount,
    loadImage, generate, applyDrawCells, updatePresets,
    setBrand, setGridWidth, setGridHeight, setBoardSize, setSizeMode,
    applyOriginalRatio, toggleExcludeColor, setViewMode, reset
  };
});
