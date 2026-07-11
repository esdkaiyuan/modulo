import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { encodeBitmap, type BitOrder, type Polarity, type ScanDirection } from '../../../engines/bitmapEncoder';
import { createPalette16, encodeColorImage } from '../../../engines/colorEncoder';
import { makeModuloFileName } from '../../../engines/exportFormatter';
import { imageDataToGray, processGrayToBitmap, processImageData, type DitherMode } from '../../../engines/imageProcessor';
import { makeTextBlob, sanitizeIdentifier } from '../../../engines/outputFormatter';
import type { EncodedModuloResult, ExportFormat, ModuloMode, Rgb565ByteOrder, Rgb888Order } from '../../shared/moduloTypes';

export interface ExtractedVideoFrame { imageData: ImageData; time: number }
export interface LoadExtractedVideoFramesPayload { fileName: string; width: number; height: number; duration: number; objectUrl?: string; frames: ExtractedVideoFrame[] }
export interface ProcessedVideoFrame { time: number; bitmap: Uint8Array; bytes: Uint8Array; result: EncodedModuloResult }

export const useVideoModuloStore = defineStore('videoModulo', () => {
  const fileName = ref(''); const sourceWidth = ref(0); const sourceHeight = ref(0); const duration = ref(0); const objectUrl = ref('');
  const extractedFrames = ref<ExtractedVideoFrame[]>([]); const processedFrames = ref<ProcessedVideoFrame[]>([]); const selectedIndex = ref(0);
  const startTime = ref(0); const endTime = ref(0); const sampleFps = ref(10); const sampleEveryNFrames = ref(1); const outputFps = ref(10);
  const targetWidth = ref(128); const targetHeight = ref(64); const brightness = ref(0); const contrast = ref(1); const threshold = ref(128);
  const dithering = ref<DitherMode>('none'); const scanDirection = ref<ScanDirection>('horizontal-ltr'); const bitOrder = ref<BitOrder>('msb'); const polarity = ref<Polarity>('positive');
  const mode = ref<ModuloMode>('mono'); const exportFormat = ref<ExportFormat>('c-array'); const rgb565ByteOrder = ref<Rgb565ByteOrder>('msb-first'); const rgb888Order = ref<Rgb888Order>('rgb'); const transparentBackground = ref('#FFFFFF');

  const selectedFrame = computed(() => processedFrames.value[selectedIndex.value] ?? processedFrames.value[0] ?? null);
  const bytesPerFrame = computed(() => processedFrames.value[0]?.bytes.length ?? Math.ceil(targetWidth.value * targetHeight.value / 8));
  const estimatedBytes = computed(() => processedFrames.value.reduce((sum, frame) => sum + frame.bytes.length, mode.value === 'palette16' && processedFrames.value.length ? 32 : 0));
  const outputName = computed(() => `${sanitizeIdentifier(fileName.value || 'video')}_video`);
  const generatedSource = computed(() => {
    if (exportFormat.value !== 'c-array') {
      const data = sequenceBytes();
      return exportFormat.value === 'bin' ? `[binary output] ${data.length} bytes` : Array.from(data).map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }
    const frameCount = processedFrames.value.length;
    const lines = [`// Video: ${fileName.value || 'untitled'}`, `// Resolution: ${targetWidth.value}x${targetHeight.value}, FPS: ${outputFps.value}, Frames: ${frameCount}, ${mode.value}`];
    if (mode.value === 'palette16' && processedFrames.value[0]) lines.push(`const uint8_t ${outputName.value}_palette[32] PROGMEM = { ${Array.from(processedFrames.value[0].result.paletteBytes).map(hex).join(', ')} };`);
    lines.push(`const uint8_t ${outputName.value}_frames[${frameCount}][${bytesPerFrame.value}] PROGMEM = {`);
    processedFrames.value.forEach((frame, index) => { lines.push(`  // Frame ${index} - Time: ${frame.time.toFixed(3)}s`); lines.push(`  { ${Array.from(frame.bytes).map(hex).join(', ')} }${index < frameCount - 1 ? ',' : ''}`); });
    lines.push('};', `const uint16_t ${outputName.value}_frame_count = ${frameCount};`, `const uint16_t ${outputName.value}_width = ${targetWidth.value};`, `const uint16_t ${outputName.value}_height = ${targetHeight.value};`, `const uint16_t ${outputName.value}_fps = ${outputFps.value};`);
    return lines.join('\n');
  });
  const outputFileName = computed(() => makeModuloFileName(outputName.value, exportFormat.value));

  function hex(byte: number) { return `0x${byte.toString(16).padStart(2, '0').toUpperCase()}`; }
  function loadExtractedFrames(payload: LoadExtractedVideoFramesPayload) {
    fileName.value = payload.fileName; sourceWidth.value = payload.width; sourceHeight.value = payload.height; duration.value = payload.duration; objectUrl.value = payload.objectUrl ?? objectUrl.value; extractedFrames.value = payload.frames;
    startTime.value = payload.frames[0]?.time ?? 0; endTime.value = payload.duration || payload.frames.at(-1)?.time || 0; selectedIndex.value = 0; processFrames();
  }
  function processFrames() {
    const images = extractedFrames.value.map((frame) => processImageData(frame.imageData, { cropX: 0, cropY: 0, cropWidth: frame.imageData.width, cropHeight: frame.imageData.height, targetWidth: targetWidth.value, targetHeight: targetHeight.value, brightness: brightness.value, contrast: contrast.value, scalingAlgorithm: 'nearest' }));
    const palette = mode.value === 'palette16' ? createPalette16(images, transparentBackground.value) : undefined;
    processedFrames.value = extractedFrames.value.map((frame, index) => {
      const image = images[index]; const bitmap = processGrayToBitmap(imageDataToGray(image), { sourceWidth: image.width, sourceHeight: image.height, targetWidth: image.width, targetHeight: image.height, brightness: 0, contrast: 1, threshold: threshold.value, dither: dithering.value });
      const monoBytes = encodeBitmap(bitmap, image.width, image.height, { scan: scanDirection.value, bitOrder: bitOrder.value, polarity: polarity.value });
      const result = mode.value === 'mono' ? { mode: 'mono' as const, width: image.width, height: image.height, bytes: monoBytes, paletteBytes: new Uint8Array(), previewImageData: image } : encodeColorImage(image, mode.value, { scan: scanDirection.value, rgb565ByteOrder: rgb565ByteOrder.value, rgb888Order: rgb888Order.value, background: transparentBackground.value, palette });
      return { time: frame.time, bitmap, bytes: result.bytes, result };
    });
    selectedIndex.value = Math.min(selectedIndex.value, Math.max(0, processedFrames.value.length - 1));
  }
  function sequenceBytes() {
    const chunks = [...(mode.value === 'palette16' && processedFrames.value[0] ? [processedFrames.value[0].result.paletteBytes] : []), ...processedFrames.value.map((frame) => frame.result.bytes)];
    const output = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0)); let offset = 0; chunks.forEach((chunk) => { output.set(chunk, offset); offset += chunk.length; }); return output;
  }
  function outputBlob() { if (exportFormat.value === 'c-array') return makeTextBlob(generatedSource.value); const data = sequenceBytes(); return exportFormat.value === 'bin' ? new Blob([data], { type: 'application/octet-stream' }) : makeTextBlob(generatedSource.value); }

  return { fileName, sourceWidth, sourceHeight, duration, objectUrl, extractedFrames, processedFrames, selectedIndex, startTime, endTime, sampleFps, sampleEveryNFrames, outputFps, targetWidth, targetHeight, brightness, contrast, threshold, dithering, scanDirection, bitOrder, polarity, mode, exportFormat, rgb565ByteOrder, rgb888Order, transparentBackground, selectedFrame, bytesPerFrame, estimatedBytes, outputName, generatedSource, outputFileName, loadExtractedFrames, processFrames, outputBlob };
});
