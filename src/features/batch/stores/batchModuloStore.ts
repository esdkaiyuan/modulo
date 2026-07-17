import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { BitOrder, Polarity, ScanDirection } from '../../../engines/bitmapEncoder';
import type { DitherMode } from '../../../engines/imageProcessor';
import type { ColorByteOrder, ColorMode } from '../../../engines/colorProcessor';
import { formatCArray, formatColorArray, makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';
import { fitToAspect, type SizeMode } from '../../shared/sizeMode';
import { getFrameProcessorPool } from '../../../workers/frameProcessorPool';

export type BatchStatus = 'pending' | 'processing' | 'done' | 'error';

export interface BatchImagePayload {
  fileName: string;
  size: number;
  type: string;
  imageData: ImageData;
  dataUrl?: string;
}

export interface BatchItem {
  id: string;
  fileName: string;
  size: number;
  type: string;
  width: number;
  height: number;
  imageData: ImageData;
  dataUrl: string;
  status: BatchStatus;
  progress: number;
  bitmap: Uint8Array;
  bytes: Uint8Array;
  /** Color modes: quantized RGBA at output size for previews. */
  preview?: Uint8ClampedArray;
  outputWidth: number;
  outputHeight: number;
  source: string;
  error: string;
}

let nextId = 1;

function makeId() {
  nextId += 1;
  return `batch-${nextId}`;
}

export const useBatchModuloStore = defineStore('batchModulo', () => {
  const items = ref<BatchItem[]>([]);
  const selectedId = ref('');
  const logs = ref<string[]>([]);

  const targetWidth = ref(128);
  const targetHeight = ref(64);
  // Size mode applies per-item: 'custom' packs every image into the same
  // targetW×H; 'aspect' fits each image to its own ratio within `aspectLongEdge`.
  const sizeMode = ref<SizeMode>('custom');
  const aspectLongEdge = ref(64);
  const brightness = ref(0);
  const contrast = ref(1);
  const threshold = ref(128);
  const dithering = ref<DitherMode>('floyd-steinberg');
  const colorMode = ref<ColorMode>('mono');
  const colorByteOrder = ref<ColorByteOrder>('big');
  const scanDirection = ref<ScanDirection>('horizontal-ltr');
  const bitOrder = ref<BitOrder>('msb');
  const polarity = ref<Polarity>('positive');

  const selectedItem = computed(() => items.value.find((item) => item.id === selectedId.value) ?? items.value[0] ?? null);
  const summary = computed(() => ({
    total: items.value.length,
    completed: items.value.filter((item) => item.status === 'done').length,
    failed: items.value.filter((item) => item.status === 'error').length,
    pending: items.value.filter((item) => item.status === 'pending').length,
    processing: items.value.filter((item) => item.status === 'processing').length
  }));
  const overallProgress = computed(() => {
    if (items.value.length === 0) return 0;
    return Math.round(items.value.reduce((sum, item) => sum + item.progress, 0) / items.value.length);
  });
  const mergedSource = computed(() => items.value
    .filter((item) => item.status === 'done' && item.source)
    .map((item) => `// File: ${item.fileName}\n${item.source}`)
    .join('\n\n'));

  function log(message: string) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    logs.value.push(`[${time}] ${message}`);
  }

  function addImageData(payload: BatchImagePayload): BatchItem {
    const item: BatchItem = {
      id: makeId(),
      fileName: payload.fileName,
      size: payload.size,
      type: payload.type,
      width: payload.imageData.width,
      height: payload.imageData.height,
      imageData: payload.imageData,
      dataUrl: payload.dataUrl ?? '',
      status: 'pending',
      progress: 0,
      bitmap: new Uint8Array(),
      bytes: new Uint8Array(),
      outputWidth: targetWidth.value,
      outputHeight: targetHeight.value,
      source: '',
      error: ''
    };
    items.value.push(item);
    selectedId.value ||= item.id;
    log(`Queued ${item.fileName}`);
    return item;
  }

  async function processItem(item: BatchItem) {
    item.status = 'processing';
    item.progress = 35;
    item.error = '';
    try {
      const dims = sizeMode.value === 'aspect'
        ? fitToAspect(item.width, item.height, aspectLongEdge.value)
        : { width: targetWidth.value, height: targetHeight.value };
      item.progress = 65;
      const result = await getFrameProcessorPool().process({
        imageData: item.imageData,
        targetWidth: dims.width,
        targetHeight: dims.height,
        brightness: brightness.value,
        contrast: contrast.value,
        threshold: threshold.value,
        dither: dithering.value,
        scalingAlgorithm: 'nearest',
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value,
        colorMode: colorMode.value,
        colorByteOrder: colorByteOrder.value,
      });
      item.bitmap = result.bitmap;
      item.bytes = result.bytes;
      item.preview = result.preview;
      item.outputWidth = dims.width;
      item.outputHeight = dims.height;
      item.source = colorMode.value !== 'mono'
        ? formatColorArray(item.bytes, colorMode.value, {
            name: sanitizeIdentifier(item.fileName),
            width: dims.width,
            height: dims.height,
            byteOrder: colorByteOrder.value
          })
        : formatCArray(item.bytes, {
            name: sanitizeIdentifier(item.fileName),
            width: dims.width,
            height: dims.height
          });
      item.status = 'done';
      item.progress = 100;
      log(`Done ${item.fileName} (${item.bytes.length} bytes)`);
    } catch (error) {
      item.status = 'error';
      item.progress = 0;
      item.error = error instanceof Error ? error.message : 'Unknown processing error';
      log(`Error ${item.fileName}: ${item.error}`);
    }
  }

  async function processAll() {
    const pool = getFrameProcessorPool();
    const pending = items.value.filter((item) => item.status === 'pending' || item.status === 'error');
    await Promise.all(pending.map((item) => processItem(item)));
    void pool; // keep reference
  }

  async function reprocessAll() {
    for (const item of items.value) {
      item.status = 'pending';
      item.progress = 0;
    }
    await processAll();
  }

  async function retryItem(id: string) {
    const item = items.value.find((candidate) => candidate.id === id);
    if (!item) return;
    item.status = 'pending';
    item.progress = 0;
    processItem(item);
  }

  function releaseUrl(item: BatchItem) {
    if (item.dataUrl.startsWith('blob:')) URL.revokeObjectURL(item.dataUrl);
  }

  function removeItem(id: string) {
    const removed = items.value.find((item) => item.id === id);
    if (removed) releaseUrl(removed);
    items.value = items.value.filter((item) => item.id !== id);
    if (selectedId.value === id) {
      selectedId.value = items.value[0]?.id ?? '';
    }
  }

  function clearAll() {
    items.value.forEach(releaseUrl);
    items.value = [];
    selectedId.value = '';
    logs.value = [];
  }

  function mergedBlob() {
    return makeTextBlob(mergedSource.value);
  }

  return {
    items,
    selectedId,
    logs,
    targetWidth,
    targetHeight,
    sizeMode,
    aspectLongEdge,
    brightness,
    contrast,
    threshold,
    dithering,
    colorMode,
    colorByteOrder,
    scanDirection,
    bitOrder,
    polarity,
    selectedItem,
    summary,
    overallProgress,
    mergedSource,
    addImageData,
    processAll,
    reprocessAll,
    retryItem,
    removeItem,
    clearAll,
    mergedBlob
  };
});
