# Unified Mono and Color Modulo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make image, batch, animation, video, font, and handdraw workspaces generate correct mono, RGB565, RGB888, and Palette16 data in C, HEX, and BIN formats.

**Architecture:** Normalize every source into target-sized RGBA or a 1-bit bitmap, then send it through shared color or mono encoders. Stores own page state and media metadata; shared engines own traversal, quantization, byte layout, roundtrip previews, and export formatting.

**Tech Stack:** Vue 3, TypeScript, Pinia, Canvas/ImageData, Vitest, Vue Test Utils, Vite

---

## File Structure

- Create `src/engines/colorEncoder.ts`: color traversal, alpha compositing, RGB565/RGB888 encoding, Palette16 quantization, packed indices, and decoded previews.
- Create `src/engines/exportFormatter.ts`: encoding-neutral C, HEX, and BIN exports for single and multi-frame results.
- Create `src/features/shared/moduloTypes.ts`: shared mode, export, color-order, and encoded-result contracts.
- Modify `src/engines/imageProcessor.ts`: target-sized RGBA crop/resize and color adjustments.
- Modify `src/engines/outputFormatter.ts`: retain compatibility wrappers while delegating new exports.
- Modify six Pinia stores: consume shared engines and expose consistent mode/export state.
- Modify six feature component groups: expose mode-specific controls, previews, and downloads.
- Add focused engine and store tests, then extend `src/tests/app.test.ts` for page contracts.

### Task 1: Establish a Clean Test Baseline and Resolve Vite Config Ambiguity

**Files:**
- Modify: `vite.config.js`
- Delete: `vite.config.ts`
- Test: `src/tests/app.test.ts`

- [ ] **Step 1: Run the current suite and record real failures**

Run: `npm test -- --run`

Expected: Capture the exact current pass/fail count before changing production code. Any functional failure becomes a regression constraint for later tasks.

- [ ] **Step 2: Add a configuration smoke assertion**

Add to `src/tests/app.test.ts`:

```ts
it('runs component tests in a browser-like DOM', () => {
  expect(window).toBeDefined();
  expect(document.createElement('canvas')).toBeInstanceOf(HTMLCanvasElement);
});
```

- [ ] **Step 3: Run the smoke test and verify the config problem if present**

Run: `npm test -- --run src/tests/app.test.ts`

Expected: PASS only when Vitest loads jsdom and `src/tests/setup.ts`; otherwise fail with a missing DOM error.

- [ ] **Step 4: Consolidate Vite configuration**

Use this complete `vite.config.js` shape and remove the duplicate TS config:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts'
  }
});
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- --run src/tests/app.test.ts`

Expected: PASS with no environment errors.

```bash
git add vite.config.js vite.config.ts src/tests/app.test.ts
git commit -m "test: consolidate browser test configuration"
```

### Task 2: Define Shared Modulo Contracts

**Files:**
- Create: `src/features/shared/moduloTypes.ts`
- Create: `src/tests/moduloTypes.test.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
import { describe, expect, it } from 'vitest';
import { exportExtension, isColorMode } from '../features/shared/moduloTypes';

describe('shared modulo contracts', () => {
  it('classifies modes and maps every export extension', () => {
    expect(isColorMode('mono')).toBe(false);
    expect(isColorMode('rgb565')).toBe(true);
    expect(isColorMode('rgb888')).toBe(true);
    expect(isColorMode('palette16')).toBe(true);
    expect(exportExtension('c-array')).toBe('.h');
    expect(exportExtension('hex')).toBe('.hex.txt');
    expect(exportExtension('bin')).toBe('.bin');
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/tests/moduloTypes.test.ts`

Expected: FAIL because `moduloTypes.ts` does not exist.

- [ ] **Step 3: Implement the contracts**

```ts
export type ModuloMode = 'mono' | 'rgb565' | 'rgb888' | 'palette16';
export type ExportFormat = 'c-array' | 'hex' | 'bin';
export type Rgb565ByteOrder = 'msb-first' | 'lsb-first';
export type Rgb888Order = 'rgb' | 'bgr';

export interface EncodedModuloResult {
  mode: ModuloMode;
  width: number;
  height: number;
  bytes: Uint8Array;
  paletteBytes: Uint8Array;
  previewImageData: ImageData;
}

export const isColorMode = (mode: ModuloMode) => mode !== 'mono';
export const exportExtension = (format: ExportFormat) =>
  format === 'c-array' ? '.h' : format === 'hex' ? '.hex.txt' : '.bin';
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/tests/moduloTypes.test.ts`

Expected: PASS.

```bash
git add src/features/shared/moduloTypes.ts src/tests/moduloTypes.test.ts
git commit -m "feat: define shared modulo contracts"
```

### Task 3: Build the Shared Color Encoder

**Files:**
- Create: `src/engines/colorEncoder.ts`
- Create: `src/tests/colorEncoder.test.ts`
- Modify: `src/engines/imageProcessor.ts`
- Test: `src/tests/imageProcessor.test.ts`

- [ ] **Step 1: Write known-color RGB tests**

```ts
it('encodes RGB565 byte order and RGB888 channel order', () => {
  const source = imageData([[255, 0, 0, 255], [0, 255, 0, 255]], 2, 1);
  expect(Array.from(encodeRgb565(source, scan('horizontal-ltr'), 'msb-first')))
    .toEqual([0xF8, 0x00, 0x07, 0xE0]);
  expect(Array.from(encodeRgb565(source, scan('horizontal-ltr'), 'lsb-first')))
    .toEqual([0x00, 0xF8, 0xE0, 0x07]);
  expect(Array.from(encodeRgb888(source, scan('horizontal-ltr'), 'bgr')))
    .toEqual([0, 0, 255, 0, 255, 0]);
});
```

- [ ] **Step 2: Write traversal and alpha tests**

```ts
it('uses shared scan traversal and composites transparent pixels', () => {
  const source = imageData([[255, 0, 0, 255], [0, 0, 0, 0]], 2, 1);
  expect(Array.from(encodeRgb888(source, scan('horizontal-rtl'), 'rgb', '#FFFFFF')))
    .toEqual([255, 255, 255, 255, 0, 0]);
});
```

- [ ] **Step 3: Write Palette16 packing tests**

```ts
it('packs two palette indices per byte and pads an odd pixel', () => {
  const result = encodePalette16(threeColorImage, scan('horizontal-ltr'));
  expect(result.paletteBytes).toHaveLength(32);
  expect(result.pixelBytes).toHaveLength(2);
  expect(result.pixelBytes[0] >> 4).toBe(result.indices[0]);
  expect(result.pixelBytes[0] & 0x0F).toBe(result.indices[1]);
  expect(result.pixelBytes[1] & 0x0F).toBe(0);
});
```

- [ ] **Step 4: Verify RED**

Run: `npm test -- --run src/tests/colorEncoder.test.ts`

Expected: FAIL because shared color APIs are missing.

- [ ] **Step 5: Implement one traversal source and color encoders**

`colorEncoder.ts` must export:

```ts
export interface ColorScanOptions { scan: ScanDirection }
export function scanPixelIndices(width: number, height: number, scan: ScanDirection): number[];
export function encodeRgb565(image: ImageData, options: ColorScanOptions, order: Rgb565ByteOrder, background?: string): Uint8Array;
export function encodeRgb888(image: ImageData, options: ColorScanOptions, order: Rgb888Order, background?: string): Uint8Array;
export function createPalette16(images: ImageData[], background?: string): Uint8Array;
export function encodePalette16(image: ImageData, options: ColorScanOptions, palette?: Uint8Array, background?: string): Palette16Result;
export function decodeColorResult(result: EncodedModuloResult, options: ColorDecodeOptions): ImageData;
```

Use deterministic median-cut quantization with stable tie-breaking by RGB value. Composite each source pixel before quantization. Convert RGB565 with integer masks, explicitly write each output byte, and never expose a `Uint16Array` buffer as encoded output.

- [ ] **Step 6: Add target-sized RGBA processing**

Add to `imageProcessor.ts`:

```ts
export interface ProcessColorImageOptions {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  targetWidth: number;
  targetHeight: number;
  brightness: number;
  contrast: number;
  scalingAlgorithm: 'nearest' | 'bilinear';
}

export function processImageData(source: ImageData, options: ProcessColorImageOptions): ImageData;
```

Process crop, resize, and RGB adjustments in that order. Preserve alpha until the encoder composites it.

- [ ] **Step 7: Verify GREEN and commit**

Run: `npm test -- --run src/tests/colorEncoder.test.ts src/tests/imageProcessor.test.ts`

Expected: PASS, including odd pixel packing and both byte orders.

```bash
git add src/engines/colorEncoder.ts src/engines/imageProcessor.ts src/tests/colorEncoder.test.ts src/tests/imageProcessor.test.ts
git commit -m "feat: add shared color modulo encoder"
```

### Task 4: Unify C, HEX, and BIN Export Formatting

**Files:**
- Create: `src/engines/exportFormatter.ts`
- Create: `src/tests/exportFormatter.test.ts`
- Modify: `src/engines/outputFormatter.ts`

- [ ] **Step 1: Write byte-equivalence tests**

```ts
it.each(['mono', 'rgb565', 'rgb888', 'palette16'] as const)(
  'exports identical %s bytes to C, HEX, and BIN', async (mode) => {
    const result = fixtureResult(mode);
    const binary = makeModuloBlob(result, 'bin');
    expect(new Uint8Array(await binary.arrayBuffer())).toEqual(serializedBytes(result));
    expect(parseHex(formatModuloHex(result))).toEqual(Array.from(serializedBytes(result)));
    expect(parseCBytes(formatModuloC(result, { name: 'sample' })))
      .toEqual(Array.from(serializedBytes(result)));
  }
);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/tests/exportFormatter.test.ts`

Expected: FAIL because the unified formatter is missing.

- [ ] **Step 3: Implement the serialization API**

```ts
export function serializedBytes(result: EncodedModuloResult): Uint8Array;
export function formatModuloC(result: EncodedModuloResult, options: ExportNameOptions): string;
export function formatModuloHex(result: EncodedModuloResult): string;
export function makeModuloBlob(result: EncodedModuloResult, format: ExportFormat, options?: ExportNameOptions): Blob;
export function makeModuloFileName(baseName: string, format: ExportFormat): string;
export function formatFrameSequence(sequence: EncodedFrameSequence, format: ExportFormat): string | Blob;
```

For Palette16, `serializedBytes` concatenates palette then packed indices. Multi-frame Palette16 concatenates the shared palette once, then frame bytes in order. Keep old formatter exports as wrappers until all stores migrate.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/tests/exportFormatter.test.ts src/tests/bitmapEncoder.test.ts src/tests/engines.test.ts`

Expected: PASS without changing existing mono output semantics.

```bash
git add src/engines/exportFormatter.ts src/engines/outputFormatter.ts src/tests/exportFormatter.test.ts
git commit -m "feat: unify modulo export formats"
```

### Task 5: Repair and Complete the Image Workspace

**Files:**
- Modify: `src/features/image/stores/imageModuloStore.ts`
- Modify: `src/features/image/components/ImageOptionsPanel.vue`
- Modify: `src/features/image/components/ImagePreviewPanel.vue`
- Modify: `src/features/image/components/ImageOutputPanel.vue`
- Modify: `src/features/image/components/ImageHeader.vue`
- Test: `src/tests/imageModuloStore.test.ts`
- Test: `src/tests/app.test.ts`

- [ ] **Step 1: Write failing crop, encoding, and export tests**

```ts
it('encodes the cropped target-sized image in every color mode', () => {
  store.loadImageData(fourQuadrantFixture);
  store.setCropRegion(1, 0, 1, 2);
  store.targetWidth = 1;
  store.targetHeight = 2;
  store.mode = 'rgb888';
  store.process();
  expect(store.result.width).toBe(1);
  expect(store.result.height).toBe(2);
  expect(store.result.bytes).toHaveLength(6);
  expect(Array.from(store.result.bytes)).toEqual(expectedRightColumnRgb);
});

it.each(['c-array', 'hex', 'bin'] as const)('exports image output as %s', async (format) => {
  store.exportFormat = format;
  expect(store.outputFileName).toMatch(formatExtension(format));
  expect(await exportedBytes(store.outputBlob())).toEqual(store.serializedBytes);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/tests/imageModuloStore.test.ts`

Expected: FAIL because current color output bypasses crop/resize and lacks RGB888/unified exports.

- [ ] **Step 3: Migrate the image store**

Replace separate `colorData`, `paletteBytes`, and incorrectly reused mono `bytes` with:

```ts
const mode = ref<ModuloMode>('mono');
const exportFormat = ref<ExportFormat>('c-array');
const rgb565ByteOrder = ref<Rgb565ByteOrder>('msb-first');
const rgb888Order = ref<Rgb888Order>('rgb');
const transparentBackground = ref('#FFFFFF');
const processedImageData = ref<ImageData | null>(null);
const result = ref<EncodedModuloResult>(emptyModuloResult());
```

Always call `processImageData` before mono or color encoding. Derive preview, output source, blob, byte count, and filename from `result`.

- [ ] **Step 4: Add UI controls and roundtrip preview**

Use stable selectors in the relevant components:

```html
<div data-test="image-mode" role="group">...</div>
<select data-test="image-color-encoding" v-if="store.mode !== 'mono'">...</select>
<select data-test="image-export-format">...</select>
<select data-test="image-rgb565-order" v-if="store.mode === 'rgb565'">...</select>
<select data-test="image-rgb888-order" v-if="store.mode === 'rgb888'">...</select>
```

Render `result.previewImageData` to the processed preview canvas.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/tests/imageModuloStore.test.ts src/tests/app.test.ts`

Expected: PASS for crop correctness, all modes, formats, and controls.

```bash
git add src/features/image src/tests/imageModuloStore.test.ts src/tests/app.test.ts
git commit -m "fix: unify image mono and color modulo"
```

### Task 6: Add Color and All Export Formats to Batch Processing

**Files:**
- Modify: `src/features/batch/stores/batchModuloStore.ts`
- Modify: `src/features/batch/components/BatchConfigPanel.vue`
- Modify: `src/features/batch/components/BatchResultsPanel.vue`
- Modify: `src/features/batch/components/BatchFilesTable.vue`
- Test: `src/tests/batchModuloStore.test.ts`
- Test: `src/tests/app.test.ts`

- [ ] **Step 1: Write failing batch mode tests**

```ts
it.each(['mono', 'rgb565', 'rgb888', 'palette16'] as const)(
  'processes mixed-size images in %s mode', async (mode) => {
    store.mode = mode;
    store.addImageData(redFixture);
    store.addImageData(blueFixture);
    await store.processAll();
    expect(store.items.every((item) => item.status === 'done')).toBe(true);
    expect(store.items.every((item) => item.result.mode === mode)).toBe(true);
  }
);

it('continues after one invalid item and keeps it retryable', async () => {
  addValidInvalidValid(store);
  await store.processAll();
  expect(store.summary.completed).toBe(2);
  expect(store.summary.failed).toBe(1);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/tests/batchModuloStore.test.ts`

Expected: FAIL because batch items only hold mono results.

- [ ] **Step 3: Migrate batch items and processing**

Add shared mode/order/export settings. Replace item-level `bitmap`, `bytes`, and `source` with an `EncodedModuloResult`, preview, and formatted output. Each item uses `processImageData`; processing remains isolated in `try/catch`.

For C and HEX, `mergedBlob` joins named outputs in queue order. For BIN, expose `itemBlob(id)` and disable merged download.

- [ ] **Step 4: Add batch controls and result preview**

Add mode, encoding, order, and export selectors to `BatchConfigPanel.vue`. Show the selected item's roundtrip preview and exact byte count. Keep retry/remove controls operational.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/tests/batchModuloStore.test.ts src/tests/app.test.ts`

Expected: PASS for mixed dimensions, failure isolation, and page controls.

```bash
git add src/features/batch src/tests/batchModuloStore.test.ts src/tests/app.test.ts
git commit -m "feat: add batch color modulo exports"
```

### Task 7: Add Shared-Palette Color Encoding to GIF Animation

**Files:**
- Modify: `src/features/animation/stores/animationModuloStore.ts`
- Modify: `src/features/animation/components/AnimationSettings.vue`
- Modify: `src/features/animation/components/AnimationWorkspace.vue`
- Modify: `src/features/animation/components/AnimationOutput.vue`
- Test: `src/tests/animationModuloStore.test.ts`
- Test: `src/tests/app.test.ts`

- [ ] **Step 1: Write failing frame sequence tests**

```ts
it('uses one Palette16 palette for all selected GIF frames', () => {
  store.mode = 'palette16';
  store.loadDecodedFrames(twoFrameColorFixture);
  expect(store.processedFrames).toHaveLength(2);
  expect(store.processedFrames[0].paletteBytes)
    .toEqual(store.processedFrames[1].paletteBytes);
  expect(store.delayTable).toEqual([80, 120]);
});

it.each(['c-array', 'hex', 'bin'] as const)('exports animation as %s', async (format) => {
  store.exportFormat = format;
  expect(store.outputBlob().size).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/tests/animationModuloStore.test.ts`

Expected: FAIL because frames are mono-only and export is C-only.

- [ ] **Step 3: Implement shared-palette frame processing**

Process selected frames to target-sized RGBA first. For Palette16 call `createPalette16(processedImages)` once, then encode every frame with it. For other color modes, encode independently with common settings. Preserve `sourceIndex` and `delay` alongside each result.

- [ ] **Step 4: Add animation controls and previews**

Expose mode/color/export/order controls. Preview the selected encoded frame. Output metadata must retain frame count, dimensions, and delay table in C and HEX.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/tests/animationModuloStore.test.ts src/tests/app.test.ts`

Expected: PASS with stable palettes and delays.

```bash
git add src/features/animation src/tests/animationModuloStore.test.ts src/tests/app.test.ts
git commit -m "feat: add animation color modulo exports"
```

### Task 8: Add Shared-Palette Color Encoding to Video

**Files:**
- Modify: `src/features/video/stores/videoModuloStore.ts`
- Modify: `src/features/video/components/VideoSettings.vue`
- Modify: `src/features/video/components/VideoWorkspace.vue`
- Modify: `src/features/video/components/VideoOutput.vue`
- Test: `src/tests/videoModuloStore.test.ts`
- Test: `src/tests/app.test.ts`

- [ ] **Step 1: Write failing video sequence tests**

```ts
it('encodes sampled color frames with one palette and retains FPS', () => {
  store.mode = 'palette16';
  store.outputFps = 12;
  store.loadExtractedFrames(twoFrameVideoFixture);
  expect(store.totalFrames).toBe(2);
  expect(store.processedFrames[0].result.paletteBytes)
    .toEqual(store.processedFrames[1].result.paletteBytes);
  expect(store.generatedSource).toContain('fps = 12');
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/tests/videoModuloStore.test.ts`

Expected: FAIL because current video processing is mono-only.

- [ ] **Step 3: Migrate video processing and export**

Apply the animation frame-result model while preserving video time values, playback selection, and FPS metadata. Palette generation uses all sampled target-sized frames. Recalculate estimated bytes from serialized results.

- [ ] **Step 4: Add controls and encoded preview**

Expose shared mode/export/order controls in `VideoSettings.vue`; render selected roundtrip output in `VideoWorkspace.vue`; make `VideoOutput.vue` download the selected format.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/tests/videoModuloStore.test.ts src/tests/app.test.ts`

Expected: PASS with FPS, time order, playback, and shared palette intact.

```bash
git add src/features/video src/tests/videoModuloStore.test.ts src/tests/app.test.ts
git commit -m "feat: add video color modulo exports"
```

### Task 9: Render and Encode Color Fonts

**Files:**
- Modify: `src/engines/fontRenderer.ts`
- Modify: `src/features/font/stores/fontModuloStore.ts`
- Modify: `src/features/font/components/FontOptionsPanel.vue`
- Modify: `src/features/font/components/FontPreviewPanel.vue`
- Modify: `src/features/font/components/FontOutputPanel.vue`
- Test: `src/tests/fontRenderer.test.ts`
- Test: `src/tests/fontModuloStore.test.ts`
- Test: `src/tests/app.test.ts`

- [ ] **Step 1: Write failing glyph color blending test**

```ts
it('blends foreground and background using glyph coverage', () => {
  const coverage = new ImageData(new Uint8ClampedArray([0, 0, 0, 128]), 1, 1);
  const result = colorizeFontImageData(coverage, '#FF0000', '#0000FF');
  expect(Array.from(result.data)).toEqual([128, 0, 127, 255]);
});
```

- [ ] **Step 2: Write failing font store mode tests**

```ts
it.each(['rgb565', 'rgb888', 'palette16'] as const)('generates %s font output', (mode) => {
  store.mode = mode;
  store.foregroundColor = '#FF0000';
  store.backgroundColor = '#0000FF';
  store.generateFromImageData(glyphFixture);
  expect(store.result.mode).toBe(mode);
  expect(store.result.previewImageData.width).toBe(store.targetWidth);
});
```

- [ ] **Step 3: Verify RED**

Run: `npm test -- --run src/tests/fontRenderer.test.ts src/tests/fontModuloStore.test.ts`

Expected: FAIL because font rendering only produces mono bitmaps.

- [ ] **Step 4: Implement RGBA font rendering and store migration**

Add `renderTextToImageData`/`colorizeFontImageData` as the color source. Keep the existing mono conversion unchanged. Add mode, export, order, foreground, background, and transparent-background state and route the RGBA image through `colorEncoder`.

- [ ] **Step 5: Add font controls and preview**

Use native color inputs for foreground/background, a checkbox for transparency, and shared selectors for mode/encoding/export. Preview decoded encoded pixels at a stable aspect ratio.

- [ ] **Step 6: Verify GREEN and commit**

Run: `npm test -- --run src/tests/fontRenderer.test.ts src/tests/fontModuloStore.test.ts src/tests/app.test.ts`

Expected: PASS for color blending, mono regression, formats, and controls.

```bash
git add src/engines/fontRenderer.ts src/features/font src/tests/fontRenderer.test.ts src/tests/fontModuloStore.test.ts src/tests/app.test.ts
git commit -m "feat: add color font modulo exports"
```

### Task 10: Encode Handdraw Pixel Colors

**Files:**
- Modify: `src/stores/pixelStore.ts`
- Modify: `src/features/handdraw/components/RightPanel.vue`
- Modify: `src/features/handdraw/components/OutputPanel.vue`
- Modify: `src/features/handdraw/components/PixelCanvas.vue`
- Test: `src/tests/pixelStore.test.ts`
- Test: `src/tests/app.test.ts`

- [ ] **Step 1: Write failing color and history tests**

```ts
it('encodes painted colors and transparent cells without changing history', () => {
  store.setCanvasSize(2);
  store.activeColor = '#FF0000';
  store.paintPixel(0, 0);
  store.mode = 'rgb888';
  store.transparentBackground = '#FFFFFF';
  expect(Array.from(store.result.bytes)).toEqual([
    255, 0, 0, 255, 255, 255,
    255, 255, 255, 255, 255, 255
  ]);
  store.undo();
  expect(store.result.bytes.every((byte) => byte === 255)).toBe(true);
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/tests/pixelStore.test.ts`

Expected: FAIL because handdraw export reduces colors to occupancy bits.

- [ ] **Step 3: Add a canvas-to-ImageData adapter and shared exports**

Create an internal adapter that converts each `PixelValue` to RGBA and empty cells to alpha zero. Derive color results from current pixels and settings. Preserve existing mono `bitmapOutput`, drawing tools, symmetry, fill, undo, and redo.

- [ ] **Step 4: Add handdraw output controls and preview**

Expose Mono/Color, encoding, export, byte/channel order, and transparent fallback controls. Keep the editable canvas unchanged; render the roundtrip result in the existing output preview.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/tests/pixelStore.test.ts src/tests/app.test.ts`

Expected: PASS for colors, transparency, history, mono encoding, and UI controls.

```bash
git add src/stores/pixelStore.ts src/features/handdraw src/tests/pixelStore.test.ts src/tests/app.test.ts
git commit -m "feat: add handdraw color modulo exports"
```

### Task 11: Enforce Consistent Controls Across All Pages

**Files:**
- Modify: `src/tests/app.test.ts`
- Modify: `src/style.css`
- Modify: affected components under `src/features/*/components/`

- [ ] **Step 1: Write the failing cross-page contract test**

```ts
it.each(['image', 'batch', 'animation', 'video', 'font', 'handdraw'])(
  '%s exposes both modes and all exports', async (route) => {
    window.location.hash = `#/${route}`;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await nextTick();
    expect(wrapper.get(`[data-test="${route}-mode"]`).text()).toContain('Mono');
    expect(wrapper.get(`[data-test="${route}-mode"]`).text()).toContain('Color');
    expect(optionValues(wrapper.get(`[data-test="${route}-export-format"]`)))
      .toEqual(['c-array', 'hex', 'bin']);
  }
);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run src/tests/app.test.ts`

Expected: FAIL for any page still missing stable controls.

- [ ] **Step 3: Normalize component selectors and responsive control layout**

Use segmented controls for Mono/Color, selects for encoding/order/export, checkboxes for transparent background, and color inputs for colors. Keep controls in existing panels, use existing compact visual tokens, and ensure fixed control heights do not shift when conditional fields appear.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/tests/app.test.ts`

Expected: PASS for all six routes and conditional control visibility.

```bash
git add src/features src/style.css src/tests/app.test.ts
git commit -m "test: enforce modulo controls across pages"
```

### Task 12: Full Regression and Production Verification

**Files:**
- Modify only files required by verified failures.

- [ ] **Step 1: Run focused bug scripts**

Run: `node scripts/check-export-bugs.mjs`

Expected: Exit 0 with no export mismatch.

Run: `node scripts/check-media-utils.mjs`

Expected: Exit 0 with no media processing mismatch.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test -- --run`

Expected: All test files and tests PASS with no unhandled errors.

- [ ] **Step 3: Run type checking and production build**

Run: `npm run build`

Expected: `vue-tsc --noEmit` and Vite build both exit 0.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check`

Expected: No whitespace errors.

Run: `git status --short`

Expected: Only intentional source/test changes plus the user's pre-existing unrelated files.

- [ ] **Step 5: Commit final verified adjustments when Step 1-4 required a fix**

Stage each source or test file changed during this task by its explicit path,
then run:

```bash
git commit -m "fix: complete unified modulo verification"
```

If verification required no edits, do not create an empty commit. Never stage
reference PNG files, logs, `.claude` settings, or unrelated pre-existing
changes.
