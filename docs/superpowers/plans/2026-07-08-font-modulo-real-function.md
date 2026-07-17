# Font Modulo Real Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the font page render real text into bitmap data and C-array output.

**Architecture:** Add a font rendering engine plus a font-specific Pinia store. Reuse shared bitmap encoding and output formatting engines.

**Tech Stack:** Vue 3, Pinia, TypeScript, Canvas 2D, Vitest.

---

### Task 1: Font Renderer Tests

**Files:**
- Create: `src/tests/fontRenderer.test.ts`

- [ ] Write failing tests for image-data-to-font-bitmap conversion, thresholding, inversion, and source naming.
- [ ] Run `npm test -- --run src/tests/fontRenderer.test.ts` and confirm it fails because the module is missing.

### Task 2: Font Store Tests

**Files:**
- Create: `src/tests/fontModuloStore.test.ts`

- [ ] Write failing tests for generating bitmap, bytes, and source from text.
- [ ] Run `npm test -- --run src/tests/fontModuloStore.test.ts` and confirm it fails because the store is missing.

### Task 3: Engine And Store

**Files:**
- Create: `src/engines/fontRenderer.ts`
- Create: `src/features/font/stores/fontModuloStore.ts`

- [ ] Implement minimal rendering helpers and store pipeline.
- [ ] Run font tests and confirm they pass.

### Task 4: Page Integration

**Files:**
- Modify: `src/features/font/components/FontInputPanel.vue`
- Modify: `src/features/font/components/FontPreviewPanel.vue`
- Modify: `src/features/font/components/FontOptionsPanel.vue`
- Modify: `src/features/font/components/FontOutputPanel.vue`
- Modify: `src/tests/app.test.ts`

- [ ] Replace static font mock UI with store-backed controls, preview canvas, generated source, copy, and download.
- [ ] Add app smoke test for font controls.

### Task 5: Log And Git

**Files:**
- Modify: `docs/TASK_LOG.md`

- [ ] Record the batch.
- [ ] Run all tests and build.
- [ ] Commit and push.
