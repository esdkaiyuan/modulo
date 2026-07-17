import { ref, watch, type Ref } from 'vue';
import { fitToAspect, matchesAspect, type SizeMode } from './sizeMode';

export interface UseSizeModeOptions {
  sourceWidth: Ref<number>;
  sourceHeight: Ref<number>;
  targetWidth: Ref<number>;
  targetHeight: Ref<number>;
  /** Optional callback fired after aspect mode rewrites the target dims. */
  onResize?: () => void;
}

/**
 * Shared "size mode" logic for a modulo tool.
 *
 * - `custom`: the user drives targetWidth/targetHeight freely (may distort).
 * - `aspect`: dims are locked to the source ratio, bounded by `aspectLongEdge`.
 *   Editing the long edge (or loading a new source) re-derives W×H.
 *
 * Callers should invoke `applyAspect()` after a new source loads if the mode
 * is already 'aspect', so the fresh ratio is picked up.
 */
export function useSizeMode(options: UseSizeModeOptions) {
  const { sourceWidth, sourceHeight, targetWidth, targetHeight, onResize } = options;

  const sizeMode = ref<SizeMode>('custom');
  const aspectLongEdge = ref(Math.max(targetWidth.value, targetHeight.value) || 64);

  function applyAspect() {
    const { width, height } = fitToAspect(sourceWidth.value, sourceHeight.value, aspectLongEdge.value);
    let changed = false;
    if (targetWidth.value !== width) {
      targetWidth.value = width;
      changed = true;
    }
    if (targetHeight.value !== height) {
      targetHeight.value = height;
      changed = true;
    }
    if (changed) onResize?.();
  }

  function isAspectMatched() {
    return matchesAspect(sourceWidth.value, sourceHeight.value, targetWidth.value, targetHeight.value);
  }

  // Switching into aspect mode, or nudging the long edge while in it, re-fits.
  watch([sizeMode, aspectLongEdge], () => {
    if (sizeMode.value === 'aspect') applyAspect();
  });

  return { sizeMode, aspectLongEdge, applyAspect, isAspectMatched };
}
