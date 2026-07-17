# Image Modulo Real Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the image modulo page process real uploaded images into dot-matrix previews and C-array output.

**Architecture:** Keep image-processing algorithms in pure TypeScript engines. Use a feature-specific Pinia store to coordinate decoded image data, parameters, generated bitmap, output bytes, and UI status. Components stay thin and bind to store actions/state.

**Tech Stack:** Vue 3, Pinia, TypeScript, Canvas 2D, Vitest.

---

### Task 1: Engine Tests

**Files:**
- Create: `src/tests/imageProcessor.test.ts`
- Create: `src/tests/bitmapEncoder.test.ts`

- [ ] Write failing tests for grayscale conversion, nearest-neighbor resizing, thresholding, dithering, bitmap encoding, and C-array formatting.
- [ ] Run `npm test -- --run src/tests/imageProcessor.test.ts src/tests/bitmapEncoder.test.ts` and confirm tests fail because modules are missing.

### Task 2: Processing Engines

**Files:**
- Create: `src/engines/imageProcessor.ts`
- Create: `src/engines/bitmapEncoder.ts`
- Create: `src/engines/outputFormatter.ts`

- [ ] Implement the minimum code needed for the engine tests.
- [ ] Run `npm test -- --run src/tests/imageProcessor.test.ts src/tests/bitmapEncoder.test.ts` and confirm tests pass.

### Task 3: Image Store

**Files:**
- Create: `src/features/image/stores/imageModuloStore.ts`
- Create: `src/tests/imageModuloStore.test.ts`

- [ ] Write failing tests for loading synthetic image data, updating parameters, generating bitmap bytes, and generated source output.
- [ ] Implement the store pipeline.
- [ ] Run `npm test -- --run src/tests/imageModuloStore.test.ts` and confirm tests pass.

### Task 4: Page Integration

**Files:**
- Modify: `src/features/image/components/ImageImportPanel.vue`
- Modify: `src/features/image/components/ImagePreviewPanel.vue`
- Modify: `src/features/image/components/ImageOptionsPanel.vue`
- Modify: `src/features/image/components/ImageOutputPanel.vue`
- Modify: `src/tests/app.test.ts`

- [ ] Replace mock values with store-backed upload, controls, preview, generated code, copy, and download.
- [ ] Add a smoke test that the image page exposes upload and generate controls.
- [ ] Run all tests and build.

### Task 5: Log And Git

**Files:**
- Modify: `docs/TASK_LOG.md`

- [ ] Record the batch, verification, branch, and commit.
- [ ] Commit and push the branch.
