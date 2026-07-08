import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { imageDataToGray, processGrayToBitmap, type DitherMode } from '../../../engines/imageProcessor';
import { formatCArray, makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';

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
  const brightness = ref(0);
  const contrast = ref(1);
  const threshold = ref(128);
  const dithering = ref<DitherMode>('floyd-steinberg');
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
      source: '',
      error: ''
    };
    items.value.push(item);
    selectedId.value ||= item.id;
    log(`Queued ${item.fileName}`);
    return item;
  }

  function processItem(item: BatchItem) {
    item.status = 'processing';
    item.progress = 35;
    item.error = '';

    try {
      const gray = imageDataToGray(item.imageData);
      item.progress = 65;
      item.bitmap = processGrayToBitmap(gray, {
        sourceWidth: item.width,
        sourceHeight: item.height,
        targetWidth: targetWidth.value,
        targetHeight: targetHeight.value,
        brightness: brightness.value,
        contrast: contrast.value,
        threshold: threshold.value,
        dither: dithering.value
      });
      item.bytes = encodeBitmap(item.bitmap, targetWidth.value, targetHeight.value, {
        scan: scanDirection.value,
        bitOrder: bitOrder.value,
        polarity: polarity.value
      });
      item.source = formatCArray(item.bytes, {
        name: sanitizeIdentifier(item.fileName),
        width: targetWidth.value,
        height: targetHeight.value
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
    for (const item of items.value) {
      if (item.status === 'pending' || item.status === 'error') {
        processItem(item);
        await Promise.resolve();
      }
    }
  }

  async function retryItem(id: string) {
    const item = items.value.find((candidate) => candidate.id === id);
    if (!item) return;
    item.status = 'pending';
    item.progress = 0;
    await processAll();
  }

  function removeItem(id: string) {
    items.value = items.value.filter((item) => item.id !== id);
    if (selectedId.value === id) {
      selectedId.value = items.value[0]?.id ?? '';
    }
  }

  function clearAll() {
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
    brightness,
    contrast,
    threshold,
    dithering,
    scanDirection,
    bitOrder,
    polarity,
    selectedItem,
    summary,
    overallProgress,
    mergedSource,
    addImageData,
    processAll,
    retryItem,
    removeItem,
    clearAll,
    mergedBlob
  };
});
