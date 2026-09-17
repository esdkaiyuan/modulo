import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { generatePattern, findClosestBead } from '../patternEngine';
import { removeBackgroundAi, removeBackgroundSimple, loadAiRemoval } from '../backgroundRemoval';
import { BEAD_BRANDS } from '../paletteData';
import type { BeadBrandId, PatternResult, PatternSettings } from '../types';

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
  const brandId = ref<BeadBrandId>('mard-standard');
  const sizeMode = ref<BeadSizeMode>('aspect');
  const gridWidth = ref(29);
  const gridHeight = ref(29);
  const aspectLongEdge = ref(29);
  const lockAspectRatio = ref(false);
  const boardSize = ref(29);
  const viewMode = ref<'colors' | 'symbols' | 'both'>('colors');
  const showGrid = ref(true);
  const showBoardLines = ref(true);
  const showCenterCrosshair = ref(true);
  const showColorCodes = ref(false);
  const bgRemoveMode = ref<'none' | 'auto' | 'tolerance' | 'corner' | 'ai'>('none');
  const bgTolerance = ref(25);
  const isRemovingBg = ref(false);
  const bgRemoveProgress = ref(0);
  const originalImageData = ref<ImageData | null>(null);
  const originalDataUrl = ref('');
  const excludeColors = ref<Set<string>>(new Set());
  const patternTitle = ref('');

  // ── Generated pattern ──
  const pattern = ref<PatternResult | null>(null);
  const isGenerating = ref(false);

  // ── Derived from the generated pattern ──
  // Each tab reports its own stats (Draw / Canvas emit them), so these always
  // describe the image pattern and stay consistent with the preview + exports.
  const materials = computed(() => pattern.value?.materials ?? []);
  const totalBeads = computed(() => pattern.value?.totalBeads ?? 0);

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
    // Save original for bg removal switching
    originalImageData.value = data.imageData;
    originalDataUrl.value = data.dataUrl;

    sourceImageData.value = data.imageData;
    sourceDataUrl.value = data.dataUrl;
    sourceWidth.value = data.width;
    sourceHeight.value = data.height;
    fileName.value = data.fileName;
    fileSize.value = data.size;

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
    const settings: PatternSettings = {
      brandId: brandId.value,
      gridWidth: gridWidth.value,
      gridHeight: gridHeight.value,
      boardSize: boardSize.value,
      lockAspectRatio: lockAspectRatio.value || sizeMode.value === 'aspect',
      viewMode: viewMode.value,
      showColorCodes: showColorCodes.value,
      bgRemoveMode: bgRemoveMode.value,
      bgTolerance: bgTolerance.value
    };

    pattern.value = generatePattern(sourceImageData.value!, settings, excludeColors.value);
    isGenerating.value = false;
  }

  function setGridWidth(w: number) {
    const clamped = Math.max(1, Math.min(200, Math.round(w)));
    gridWidth.value = clamped;
    if ((sizeMode.value === 'aspect' || lockAspectRatio.value) && sourceWidth.value > 0 && sourceHeight.value > 0) {
      gridHeight.value = Math.max(1, Math.round((clamped * sourceHeight.value) / sourceWidth.value));
    }
    generate();
  }

  function setGridHeight(h: number) {
    const clamped = Math.max(1, Math.min(200, Math.round(h)));
    gridHeight.value = clamped;
    if ((sizeMode.value === 'aspect' || lockAspectRatio.value) && sourceWidth.value > 0 && sourceHeight.value > 0) {
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

  function setLockAspectRatio(value: boolean) {
    lockAspectRatio.value = value;
    if (value && sourceWidth.value > 0 && sourceHeight.value > 0) {
      gridHeight.value = Math.max(1, Math.round((gridWidth.value * sourceHeight.value) / sourceWidth.value));
      generate();
    }
  }

  function clearExcludeColors() {
    if (excludeColors.value.size === 0) return;
    excludeColors.value = new Set();
    generate();
  }

  function setShowGrid(value: boolean) {
    showGrid.value = value;
  }

  function setShowBoardLines(value: boolean) {
    showBoardLines.value = value;
  }

  function setShowCenterCrosshair(value: boolean) {
    showCenterCrosshair.value = value;
  }

  function setShowColorCodes(value: boolean) {
    showColorCodes.value = value;
  }

  function setBgRemoveMode(mode: 'none' | 'auto' | 'tolerance' | 'corner' | 'ai') {
    bgRemoveMode.value = mode;
    applyBgRemovalAndGenerate();
  }

  function setBgTolerance(val: number) {
    bgTolerance.value = Math.max(0, Math.min(200, Math.round(val)));
    if (bgRemoveMode.value !== 'none' && bgRemoveMode.value !== 'ai') {
      applyBgRemovalAndGenerate();
    }
  }

  /**
   * Apply the current background removal mode to the original image,
   * then regenerate the pattern.
   */
  async function applyBgRemovalAndGenerate() {
    if (!originalImageData.value || !originalDataUrl.value) return;

    const mode = bgRemoveMode.value;

    if (mode === 'none') {
      sourceImageData.value = originalImageData.value;
      sourceDataUrl.value = originalDataUrl.value;
      sourceWidth.value = originalImageData.value.width;
      sourceHeight.value = originalImageData.value.height;
      generate();
      return;
    }

    if (mode === 'ai') {
      isRemovingBg.value = true;
      bgRemoveProgress.value = 0;
      try {
        const resultData = await removeBackgroundAi(
          originalDataUrl.value,
          (p) => { bgRemoveProgress.value = p; }
        );
        sourceImageData.value = resultData;
        sourceWidth.value = resultData.width;
        sourceHeight.value = resultData.height;
        // Update dataUrl from the processed ImageData
        const canvas = document.createElement('canvas');
        canvas.width = resultData.width;
        canvas.height = resultData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(resultData, 0, 0);
        sourceDataUrl.value = canvas.toDataURL('image/png');
        generate();
      } catch (err: any) {
        console.error('AI bg removal failed:', err);
        bgRemoveMode.value = 'none';
      } finally {
        isRemovingBg.value = false;
        bgRemoveProgress.value = 0;
      }
      return;
    }

    // Simple modes: auto / tolerance / corner
    const result = removeBackgroundSimple(originalImageData.value, mode as 'auto' | 'tolerance' | 'corner', bgTolerance.value);
    sourceImageData.value = result;
    sourceWidth.value = result.width;
    sourceHeight.value = result.height;
    const canvas = document.createElement('canvas');
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(result, 0, 0);
    sourceDataUrl.value = canvas.toDataURL('image/png');
    generate();
  }

  function reset() {
    sourceImageData.value = null;
    sourceDataUrl.value = '';
    sourceWidth.value = 0;
    sourceHeight.value = 0;
    originalImageData.value = null;
    originalDataUrl.value = '';
    fileName.value = '';
    fileSize.value = 0;
    pattern.value = null;
    excludeColors.value = new Set();
    patternTitle.value = '';
    bgRemoveMode.value = 'none';
    isRemovingBg.value = false;
  }

  return {
    sourceImageData, sourceDataUrl, sourceWidth, sourceHeight,
    fileName, fileSize, brandId, sizeMode, gridWidth, gridHeight,
    aspectLongEdge, lockAspectRatio, boardSize, viewMode, excludeColors, patternTitle,
    pattern, isGenerating, hasImage: computed(() => !!sourceImageData.value),
    brand: computed(() => BEAD_BRANDS.find((b) => b.id === brandId.value) ?? BEAD_BRANDS[0]),
    materials, totalBeads, boardCount,
    loadImage, generate,
    setBrand, setGridWidth, setGridHeight, setBoardSize, setSizeMode,
    applyOriginalRatio, toggleExcludeColor, clearExcludeColors, setViewMode, setLockAspectRatio,
    setShowGrid, setShowBoardLines, setShowCenterCrosshair, setShowColorCodes,
    showGrid, showBoardLines, showCenterCrosshair,
    bgRemoveMode, bgTolerance, isRemovingBg, bgRemoveProgress,
    setBgRemoveMode, setBgTolerance,
    showColorCodes, reset
  };
});
