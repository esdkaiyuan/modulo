# Batch Image Modulo Real Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the batch page process multiple real images into C-array output.

**Architecture:** Add a batch-specific Pinia store that holds queue items and delegates all image extraction to the existing shared engines. Update batch components to bind to that store.

**Tech Stack:** Vue 3, Pinia, TypeScript, Canvas 2D, Vitest.

---

### Task 1: Batch Store Tests

**Files:**
- Create: `src/tests/batchModuloStore.test.ts`

- [ ] Write failing tests for queue insertion, processing all pending images, summary counts, log entries, selected result source, and merged output.
- [ ] Run `npm test -- --run src/tests/batchModuloStore.test.ts` and confirm the test fails because the store is missing.

### Task 2: Batch Store

**Files:**
- Create: `src/features/batch/stores/batchModuloStore.ts`

- [ ] Implement queue state, shared params, `addImageData`, `processAll`, `retryItem`, `removeItem`, summaries, selected result, and merged source.
- [ ] Run `npm test -- --run src/tests/batchModuloStore.test.ts` and confirm it passes.

### Task 3: Page Components

**Files:**
- Modify: `src/features/batch/components/BatchFilesTable.vue`
- Modify: `src/features/batch/components/BatchConfigPanel.vue`
- Modify: `src/features/batch/components/BatchLogPanel.vue`
- Modify: `src/features/batch/components/BatchResultsPanel.vue`
- Modify: `src/tests/app.test.ts`

- [ ] Replace mock batch UI with upload, queue table, shared params, log, selected output, and export actions.
- [ ] Add a smoke test that the batch page exposes file upload and start-batch controls.

### Task 4: Log And Git

**Files:**
- Modify: `docs/TASK_LOG.md`

- [ ] Record the batch, verification, branch, and commit.
- [ ] Run all tests and build.
- [ ] Commit and push.
