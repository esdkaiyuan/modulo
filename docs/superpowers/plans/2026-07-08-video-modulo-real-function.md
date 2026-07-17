# Video Modulo Real Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the video page extract video frames and generate dot-matrix C-array output.

**Architecture:** Add a video-specific Pinia store that accepts extracted frame `ImageData`, processes frames using existing shared engines, and generates header source. Add a browser video frame extractor utility for UI integration.

**Tech Stack:** Vue 3, Pinia, TypeScript, Canvas 2D, HTMLVideoElement, Vitest.

---

### Task 1: Video Store Tests

**Files:**
- Create: `src/tests/videoModuloStore.test.ts`

- [ ] Write failing tests for loading extracted frames, processing settings, generated output, selected frame, and metadata.
- [ ] Run `npm test -- --run src/tests/videoModuloStore.test.ts` and confirm it fails because the store is missing.

### Task 2: Store And Extractor

**Files:**
- Create: `src/features/video/stores/videoModuloStore.ts`
- Create: `src/features/video/utils/videoFrameExtractor.ts`

- [ ] Implement frame loading, processing, generated source, and output blob.
- [ ] Implement browser video frame extraction utility.
- [ ] Run video store tests and confirm they pass.

### Task 3: Page Integration

**Files:**
- Modify: `src/features/video/components/VideoHeader.vue`
- Modify: `src/features/video/components/VideoWorkspace.vue`
- Modify: `src/features/video/components/VideoSettings.vue`
- Modify: `src/features/video/components/VideoOutput.vue`
- Modify: `src/tests/app.test.ts`

- [ ] Replace mock video UI with upload, video preview, extraction controls, frame strip, matrix preview, generated output, copy, and download.
- [ ] Add app smoke test for video upload and generate controls.

### Task 4: Log And Git

**Files:**
- Modify: `docs/TASK_LOG.md`

- [ ] Record the batch.
- [ ] Run all tests and build.
- [ ] Commit and push.
