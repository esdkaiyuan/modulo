# Animation Video Modulo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-frontend `动画/视频取模` workflow that extracts GIF/video frames with FFmpeg WebAssembly and exports frame data in three formats.

**Architecture:** Keep the Vue UI in `src/App.vue` to match the existing single-file app, but extract pure logic into `src/utils/` so byte packing and output formatting are testable. Use lazy dynamic imports for `@ffmpeg/ffmpeg` and `@ffmpeg/util`; load the Vite-compatible FFmpeg core from `@ffmpeg/core@0.12.10/dist/esm` through `toBlobURL`.

**Tech Stack:** Vue 3, Vite 5, browser Canvas APIs, FFmpeg WebAssembly packages `@ffmpeg/ffmpeg`, `@ffmpeg/util`, `@ffmpeg/core`, Node-based verification scripts.

---

## File Structure

- Create `src/utils/modulo.js`: byte packing, hex/binary formatting, byte count helpers.
- Create `src/utils/animationFormatters.js`: per-frame arrays, complete animation structure, raw hex output, header output.
- Create `src/utils/mediaExtractor.js`: lazy FFmpeg loader and media-to-PNG-frame extraction.
- Create `scripts/check-media-utils.mjs`: Node verification for modulo helpers and animation formatters.
- Modify `src/App.vue`: add tab, upload UI, extraction controls, media state, generation/copy/export functions, styles.
- Modify `package.json` and `package-lock.json`: add FFmpeg dependencies.
- Modify `scripts/check-export-bugs.mjs`: include media copy/export formatter checks if needed.

## Task 1: Pure Modulo Utilities

**Files:**
- Create: `src/utils/modulo.js`
- Create: `scripts/check-media-utils.mjs`

- [ ] **Step 1: Write the failing utility checks**

Add `scripts/check-media-utils.mjs` with assertions for row scan, column scan, encoding, and formatter output:

```js
import assert from 'node:assert/strict'
import {
  packImageDataToModulo,
  getBytesPerFrame,
  formatHexData,
  formatBinData,
} from '../src/utils/modulo.js'

const imageData = {
  data: new Uint8ClampedArray([
    0, 0, 0, 255,       255, 255, 255, 255, 0, 0, 0, 255,       255, 255, 255, 255,
    255, 255, 255, 255, 0, 0, 0, 255,       255, 255, 255, 255, 0, 0, 0, 255,
  ]),
}

assert.deepEqual(
  packImageDataToModulo(imageData, 4, 2, {
    scanMode: 'row',
    encodingMode: '阴码',
    byteOrder: 'msb',
    threshold: 128,
  }),
  [0b10100000, 0b01010000]
)

assert.deepEqual(
  packImageDataToModulo(imageData, 4, 2, {
    scanMode: 'row',
    encodingMode: '阳码',
    byteOrder: 'msb',
    threshold: 128,
  }),
  [0b01010000, 0b10100000]
)

assert.deepEqual(
  packImageDataToModulo(imageData, 4, 2, {
    scanMode: 'column',
    encodingMode: '阴码',
    byteOrder: 'lsb',
    threshold: 128,
  }),
  [0b00000001, 0b00000010, 0b00000001, 0b00000010]
)

assert.equal(getBytesPerFrame(16, 16, 'row'), 32)
assert.equal(getBytesPerFrame(16, 16, 'column'), 32)
assert.equal(formatHexData([0, 10, 255]), '0x00, 0x0A, 0xFF')
assert.equal(formatBinData([5]), '00000101')
```

- [ ] **Step 2: Run the check and verify it fails**

Run: `node scripts/check-media-utils.mjs`

Expected: FAIL with module-not-found for `src/utils/modulo.js`.

- [ ] **Step 3: Implement `src/utils/modulo.js`**

Implement named exports:

```js
export const getBytesPerFrame = (width, height, scanMode) => {
  return scanMode === 'row'
    ? Math.ceil(width / 8) * height
    : Math.ceil(height / 8) * width
}

export const formatHexData = (data) => {
  return Array.from(data).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')
}

export const formatBinData = (data) => {
  return Array.from(data).map(b => b.toString(2).padStart(8, '0')).join('\n')
}

export const packImageDataToModulo = (imageData, width, height, options) => {
  const {
    scanMode = 'row',
    encodingMode = '阴码',
    byteOrder = 'msb',
    threshold = 128,
  } = options
  const pixels = imageData.data
  const data = []

  const shouldSetBit = (gray) => {
    const isOn = gray < threshold
    return encodingMode === '阴码' ? isOn : !isOn
  }

  const bitMask = (bit) => 1 << (byteOrder === 'msb' ? (7 - bit) : bit)

  if (scanMode === 'row') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x += 8) {
        let byte = 0
        for (let bit = 0; bit < 8 && (x + bit) < width; bit++) {
          const idx = (y * width + x + bit) * 4
          const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
          if (shouldSetBit(gray)) byte |= bitMask(bit)
        }
        data.push(byte)
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y += 8) {
        let byte = 0
        for (let bit = 0; bit < 8 && (y + bit) < height; bit++) {
          const idx = ((y + bit) * width + x) * 4
          const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
          if (shouldSetBit(gray)) byte |= bitMask(bit)
        }
        data.push(byte)
      }
    }
  }

  return data
}
```

- [ ] **Step 4: Run the check and verify it passes**

Run: `node scripts/check-media-utils.mjs`

Expected: PASS with exit code 0.

## Task 2: Animation Output Formatters

**Files:**
- Modify: `src/utils/animationFormatters.js`
- Modify: `scripts/check-media-utils.mjs`

- [ ] **Step 1: Extend the failing checks**

Append checks that call:

```js
import {
  formatFrameArraysCode,
  formatAnimationStructCode,
  formatRawHexFrames,
  formatAnimationHeader,
} from '../src/utils/animationFormatters.js'

const frames = [
  { index: 0, data: [0, 24] },
  { index: 1, data: [60, 255] },
]
const meta = { width: 8, height: 2, frameDelay: 200, bytesPerFrame: 2 }

const arrays = formatFrameArraysCode(frames)
assert.match(arrays, /anim_frame_000/)
assert.match(arrays, /anim_frame_001/)

const struct = formatAnimationStructCode(frames, meta)
assert.match(struct, /ANIM_WIDTH 8/)
assert.match(struct, /ANIM_HEIGHT 2/)
assert.match(struct, /ANIM_FRAME_COUNT 2/)
assert.match(struct, /AnimationBitmap/)

const raw = formatRawHexFrames(frames)
assert.match(raw, /\/\/ frame 0/)
assert.match(raw, /0x3C, 0xFF/)

const header = formatAnimationHeader(frames, meta)
assert.match(header, /extern const AnimationBitmap animation_bitmap;/)
```

- [ ] **Step 2: Run the check and verify it fails**

Run: `node scripts/check-media-utils.mjs`

Expected: FAIL with module-not-found for `src/utils/animationFormatters.js`.

- [ ] **Step 3: Implement `src/utils/animationFormatters.js`**

Implement the four formatter exports using `formatHexData` from `modulo.js`.

- [ ] **Step 4: Run the check and verify it passes**

Run: `node scripts/check-media-utils.mjs`

Expected: PASS with exit code 0.

## Task 3: FFmpeg Dependencies And Extractor

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/utils/mediaExtractor.js`

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install @ffmpeg/ffmpeg@0.12.15 @ffmpeg/util@0.12.2 @ffmpeg/core@0.12.10
```

Expected: package files include the three dependencies.

- [ ] **Step 2: Implement `src/utils/mediaExtractor.js`**

Create a lazy loader:

```js
let ffmpegInstance = null
let ffmpegLoaded = false

export const ensureFfmpegLoaded = async (onProgress = () => {}) => {
  if (ffmpegLoaded && ffmpegInstance) return ffmpegInstance
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import('@ffmpeg/ffmpeg'),
    import('@ffmpeg/util'),
  ])
  const ffmpeg = ffmpegInstance || new FFmpeg()
  ffmpegInstance = ffmpeg
  ffmpeg.on('progress', ({ progress }) => {
    onProgress(Math.max(0, Math.min(1, progress || 0)))
  })
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm'
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })
  ffmpegLoaded = true
  return ffmpeg
}
```

Add `extractMediaFrames(file, options)` that writes the file, runs FFmpeg with `-vf fps=<fps>` and `-frames:v <maxFrames>` when needed, reads `frame_%04d.png`, and returns `{ index, timestampMs, blob, previewUrl }` objects.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS. This validates dependency imports and Vite bundling.

## Task 4: Vue Media State And UI

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Add imports**

Import helpers:

```js
import { packImageDataToModulo, getBytesPerFrame, formatHexData, formatBinData } from './utils/modulo.js'
import { formatFrameArraysCode, formatAnimationStructCode, formatRawHexFrames, formatAnimationHeader } from './utils/animationFormatters.js'
import { extractMediaFrames } from './utils/mediaExtractor.js'
```

- [ ] **Step 2: Add sidebar tab**

Add `media` tab with label `动画/视频取模`.

- [ ] **Step 3: Add template workflow**

Add upload area, extraction controls, progress, previews, result tabs, copy/export buttons.

- [ ] **Step 4: Add media state**

Add refs/reactives from the design spec:

```js
const mediaFile = ref(null)
const mediaUrl = ref('')
const mediaType = ref('')
const mediaExtractionMode = ref('fpsAndMax')
const mediaFps = ref(5)
const mediaMaxFrames = ref(64)
const mediaFrameDelay = ref(200)
const mediaUseCustomDelay = ref(false)
const mediaStatus = ref('idle')
const mediaProgress = ref(0)
const mediaError = ref('')
const mediaFrames = reactive([])
const mediaResult = ref(null)
const mediaActiveTab = ref('struct')
```

- [ ] **Step 5: Add event handlers**

Implement:

```js
const handleMediaUpload = (event) => {}
const handleMediaDrop = (event) => {}
const generateMediaModulo = async () => {}
const getMediaOutputText = () => {}
const copyMediaResult = () => {}
const exportMediaCFile = () => {}
const exportMediaHeaderFile = () => {}
```

- [ ] **Step 6: Add styles**

Add styles matching existing panels: media metadata row, progress bar, frame grid, animation preview, warning text.

- [ ] **Step 7: Run build**

Run: `npm run build`

Expected: PASS.

## Task 5: Verification

**Files:**
- Modify if needed: `scripts/check-export-bugs.mjs`

- [ ] **Step 1: Run utility checks**

Run: `node scripts/check-media-utils.mjs`

Expected: PASS.

- [ ] **Step 2: Run export regression checks**

Run: `node scripts/check-export-bugs.mjs`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Run browser smoke check if Playwright is available**

Use Python Playwright to open the dev server and assert:

- `动画/视频取模` tab exists
- upload copy says GIF/MP4/WebM
- output tabs exist in source after generation paths are wired

Expected: no page errors.
