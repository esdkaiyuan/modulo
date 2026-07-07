# Modulo Engine Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Upgrade every workflow to use a shared, tested modulo engine with richer color formats, scan settings, presets, media support, and reusable UI modules.

**Architecture:** Build pure modules under `src/core`, `src/formatters`, and `src/media`, then connect existing workflows through compatibility wrappers before splitting the Vue UI into panels. This keeps the app buildable after every task while removing duplicate conversion loops from `App.vue`.

**Tech Stack:** Vue 3, Vite 5, browser Canvas/Image APIs, existing `gifuct-js` and `upng-js`, Node script tests using `node:assert/strict`.

---

### Task 1: Core Engine Tests And Pure Modules

**Files:**
- Create: `scripts/check-modulo-engine.mjs`
- Create: `src/core/scanOrder.js`
- Create: `src/core/monoPacking.js`
- Create: `src/core/colorPacking.js`
- Create: `src/core/moduloEngine.js`
- Modify: `package.json`

- [x] **Step 1: Write failing tests**

Create `scripts/check-modulo-engine.mjs` with assertions for RGB332, RGB565, BGR565, byte order, mono yin/yang, MSB/LSB, row/column scan, flips, rotation, and engine output metadata.

- [x] **Step 2: Run tests to verify red**

Run: `node scripts/check-modulo-engine.mjs`

Expected: fails because `src/core/moduloEngine.js` does not exist.

- [x] **Step 3: Implement pure core modules**

Implement:
- `iteratePixels(width, height, config)` in `scanOrder.js`
- `packMonoPixels(imageData, config)` in `monoPacking.js`
- `packColorPixels(imageData, config)` and `decodePackedToRgba(data, config)` in `colorPacking.js`
- `convertImageDataToModulo(imageData, config)` in `moduloEngine.js`

- [x] **Step 4: Run core tests to verify green**

Run: `node scripts/check-modulo-engine.mjs`

Expected: all assertions pass.

- [x] **Step 5: Add npm script**

Add `"check:modulo": "node scripts/check-modulo-engine.mjs"` to `package.json`.

- [x] **Step 6: Commit**

Run:

```bash
git add package.json scripts/check-modulo-engine.mjs src/core
git commit -m "feat: add shared modulo engine"
```

### Task 2: Presets And Export Formatters

**Files:**
- Create: `scripts/check-modulo-formatters.mjs`
- Create: `src/core/presets.js`
- Create: `src/formatters/cArrayFormatter.js`
- Create: `src/formatters/lvglFormatter.js`
- Create: `src/formatters/arduinoFormatter.js`
- Create: `src/formatters/binaryFormatter.js`
- Create: `src/formatters/index.js`
- Modify: `package.json`

- [x] **Step 1: Write failing tests**

Create assertions for Wisdom ILI9341 BGR565, PCtoLCD2002 16x16/32x32, LVGL RGB565/RGB888/ARGB8888, Arduino RGB565 PROGMEM, generic OLED row/page presets, C arrays, C headers, LVGL descriptor markers, Arduino markers, hex text, binary text, and raw binary output.

- [x] **Step 2: Run tests to verify red**

Run: `node scripts/check-modulo-formatters.mjs`

Expected: fails because `src/core/presets.js` and formatter modules do not exist.

- [x] **Step 3: Implement presets and formatters**

Implement named preset lookup and export formatter functions:
- `getPreset(id)`
- `listPresets()`
- `formatCArray(result, options)`
- `formatCHeader(result, options)`
- `formatLvglDescriptor(result, options)`
- `formatArduinoProgmem(result, options)`
- `formatHexText(data)`
- `formatBinaryText(data)`
- `formatRawBinary(data)`

- [x] **Step 4: Run formatter tests to verify green**

Run: `node scripts/check-modulo-formatters.mjs`

Expected: all assertions pass.

- [x] **Step 5: Add npm script**

Add `"check:formatters": "node scripts/check-modulo-formatters.mjs"` to `package.json`.

- [x] **Step 6: Commit**

Run:

```bash
git add package.json scripts/check-modulo-formatters.mjs src/core/presets.js src/formatters
git commit -m "feat: add modulo presets and formatters"
```

### Task 3: Compatibility Wrappers For Existing Workflows

**Files:**
- Modify: `src/utils/modulo.js`
- Modify: `src/utils/imageModulo.js`
- Modify: `src/utils/animationFormatters.js`
- Modify: `scripts/check-media-utils.mjs`

- [x] **Step 1: Extend existing utility tests**

Update `scripts/check-media-utils.mjs` so existing helpers also assert RGB565/BGR565, byte order, mode labels, and shared-engine preview rendering.

- [x] **Step 2: Run tests to verify red**

Run: `node scripts/check-media-utils.mjs`

Expected: fails for missing or incomplete new compatibility behavior.

- [x] **Step 3: Refactor utilities through core engine**

Keep existing exported names stable while delegating pack/render work to `src/core/moduloEngine.js` and formatters.

- [x] **Step 4: Run tests to verify green**

Run: `node scripts/check-media-utils.mjs && npm run check:modulo && npm run check:formatters`

Expected: all assertions pass.

- [x] **Step 5: Commit**

Run:

```bash
git add scripts/check-media-utils.mjs src/utils
git commit -m "refactor: route utilities through shared modulo engine"
```

### Task 4: UI Settings And Preset Integration

**Files:**
- Create: `src/composables/useModuloConfig.js`
- Create: `src/composables/useModuloResult.js`
- Modify: `src/App.vue`
- Modify: `scripts/check-export-bugs.mjs`

- [x] **Step 1: Add failing structural checks**

Extend `scripts/check-export-bugs.mjs` to assert the app imports preset/config composables, exposes preset selection text, exposes RGB565/BGR565/RGB888/ARGB8888 settings text, and does not contain duplicated image utility imports that bypass shared engine.

- [x] **Step 2: Run tests to verify red**

Run: `node scripts/check-export-bugs.mjs`

Expected: fails because the composables and UI settings are absent.

- [x] **Step 3: Add composables and wire settings**

Add shared config state, preset selection, color format options, scan/transform options, and output format options. Connect image and media generation to the shared config object.

- [x] **Step 4: Run tests to verify green**

Run: `node scripts/check-export-bugs.mjs && npm run build`

Expected: checks and build pass.

- [x] **Step 5: Commit**

Run:

```bash
git add scripts/check-export-bugs.mjs src/App.vue src/composables
git commit -m "feat: add preset-driven modulo settings"
```

### Task 5: Split Feature Panels

**Files:**
- Create: `src/components/ModuloSettingsPanel.vue`
- Create: `src/components/PresetSelector.vue`
- Create: `src/components/OutputPanel.vue`
- Create: `src/components/TextModuloPanel.vue`
- Create: `src/components/ImageModuloPanel.vue`
- Create: `src/components/BatchModuloPanel.vue`
- Create: `src/components/DrawModuloPanel.vue`
- Create: `src/components/MediaModuloPanel.vue`
- Create: `src/components/AppShell.vue`
- Modify: `src/App.vue`
- Modify: `scripts/check-export-bugs.mjs`

- [x] **Step 1: Add failing structural checks**

Update `scripts/check-export-bugs.mjs` to assert `App.vue` imports the panel components and no longer contains the main conversion-loop function names.

- [x] **Step 2: Run tests to verify red**

Run: `node scripts/check-export-bugs.mjs`

Expected: fails because panel components are not wired yet.

- [x] **Step 3: Extract UI panels**

Move workflow template and workflow-specific methods into panel components while keeping the current visual style and CSS behavior. `App.vue` remains a layout shell.

- [x] **Step 4: Run tests to verify green**

Run: `node scripts/check-export-bugs.mjs && npm run build`

Expected: checks and build pass.

- [x] **Step 5: Commit**

Run:

```bash
git add scripts/check-export-bugs.mjs src/App.vue src/components
git commit -m "refactor: split modulo workflows into panels"
```

### Task 6: Media Input Enhancements

**Files:**
- Create: `src/media/imageDecoder.js`
- Create: `src/media/bmpDecoder.js`
- Create: `src/media/icoDecoder.js`
- Create: `src/media/mediaTypes.js`
- Modify: `src/utils/mediaExtractor.js`
- Modify: `src/utils/mediaTypes.js`
- Modify: `scripts/check-media-utils.mjs`

- [x] **Step 1: Add failing media tests**

Extend media tests for BMP/ICO type recognition, SVG/AVIF accepted hints, start/end time options, OGV/MOV/M4V video recognition, and animated WebP fallback through `ImageDecoder`.

- [x] **Step 2: Run tests to verify red**

Run: `node scripts/check-media-utils.mjs`

Expected: fails for unsupported media type cases.

- [x] **Step 3: Implement media enhancements**

Add browser-first image decoding helpers, simple BMP/ICO support, richer accept strings, and start/end time extraction options.

- [x] **Step 4: Run tests to verify green**

Run: `node scripts/check-media-utils.mjs && npm run build`

Expected: checks and build pass.

- [x] **Step 5: Commit**

Run:

```bash
git add scripts/check-media-utils.mjs src/media src/utils/mediaExtractor.js src/utils/mediaTypes.js
git commit -m "feat: expand image and media input support"
```

### Task 7: Final Verification And PR Prep

**Files:**
- Modify: `docs/superpowers/plans/2026-07-07-modulo-engine-upgrade.md`

- [x] **Step 1: Run full verification**

Run:

```bash
npm run check:modulo
npm run check:formatters
node scripts/check-media-utils.mjs
node scripts/check-export-bugs.mjs
npm run build
```

Expected: every command exits 0.

- [x] **Step 2: Review status and commit plan checkbox updates**

Run:

```bash
git status --short
git log --oneline --max-count=8
```

Expected: only intentional plan checkbox updates remain, then commit them if present.

- [x] **Step 3: Push feature branch**

Run:

```bash
git push -u origin feature/modulo-engine-upgrade
```

Expected: branch is available on GitHub for PR creation.

