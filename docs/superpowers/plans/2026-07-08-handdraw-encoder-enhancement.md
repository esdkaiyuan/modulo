# Handdraw Encoder Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared encoding options and multiple output formats to the handdraw page.

**Architecture:** Extend `pixelStore` to produce a bitmap, encoded bytes, C source, HEX text, and binary blob through shared engines. Update handdraw output/settings UI to bind to the new store fields.

**Tech Stack:** Vue 3, Pinia, TypeScript, Canvas 2D, Vitest.

---

### Task 1: Store Tests

**Files:**
- Modify: `src/tests/pixelStore.test.ts`

- [ ] Add failing tests for bit order, polarity, output format, HEX output, and binary blob.
- [ ] Run `npm test -- --run src/tests/pixelStore.test.ts` and confirm tests fail before implementation.

### Task 2: Store Implementation

**Files:**
- Modify: `src/stores/pixelStore.ts`

- [ ] Add scan direction, bit order, polarity, output format, bitmap output, HEX text output, generated source, output blob, and output filename.
- [ ] Run pixel store tests and confirm they pass.

### Task 3: UI Integration

**Files:**
- Modify: `src/features/handdraw/components/OutputPanel.vue`
- Modify: `src/features/handdraw/components/RightPanel.vue`
- Modify: `src/features/handdraw/components/TopBar.vue`
- Modify: `src/tests/app.test.ts`

- [ ] Add encoding controls and output format controls to handdraw UI.
- [ ] Add copy/download behavior and app smoke test.

### Task 4: Log And Git

**Files:**
- Modify: `docs/TASK_LOG.md`

- [ ] Record the batch.
- [ ] Run all tests and build.
- [ ] Commit and push.
