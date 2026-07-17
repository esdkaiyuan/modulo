# Animation Modulo Real Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the animation page process GIF frames into embedded-ready frame data.

**Architecture:** Add an animation-specific Pinia store that processes decoded frames using existing shared engines. Add a GIF decoder utility for browser file uploads.

**Tech Stack:** Vue 3, Pinia, TypeScript, Canvas 2D, gifuct-js, Vitest.

---

### Task 1: Animation Store Tests

**Files:**
- Create: `src/tests/animationModuloStore.test.ts`

- [ ] Write failing tests for loading decoded frames, applying frame range and sampling, processing frames, generated output, delays, and selection.
- [ ] Run `npm test -- --run src/tests/animationModuloStore.test.ts` and confirm it fails because the store is missing.

### Task 2: Store And Decoder

**Files:**
- Create: `src/features/animation/stores/animationModuloStore.ts`
- Create: `src/features/animation/utils/gifDecoder.ts`
- Modify: `package.json`

- [ ] Add `gifuct-js`.
- [ ] Implement `loadDecodedFrames`, `processFrames`, generated source, selection, and GIF decode wrapper.
- [ ] Run animation store tests and confirm they pass.

### Task 3: Page Integration

**Files:**
- Modify: `src/features/animation/components/AnimationHeader.vue`
- Modify: `src/features/animation/components/AnimationWorkspace.vue`
- Modify: `src/features/animation/components/AnimationSettings.vue`
- Modify: `src/features/animation/components/AnimationOutput.vue`
- Modify: `src/tests/app.test.ts`

- [ ] Replace mock animation UI with upload, frame strip, settings, preview, output, copy, and download.
- [ ] Add app smoke test for GIF upload and generate controls.

### Task 4: Log And Git

**Files:**
- Modify: `docs/TASK_LOG.md`

- [ ] Record the batch.
- [ ] Run all tests and build.
- [ ] Commit and push.
