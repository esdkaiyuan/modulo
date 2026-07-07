# Split Animated Image And Video Modulo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the combined `动画/视频取模` tab with separate `动图取模` and `视频取模` tabs while reusing the existing FFmpeg media pipeline.

**Architecture:** Add a testable media type helper under `src/utils/`, then update `src/App.vue` to render two tab entries and workflow-specific upload copy/validation/defaults. Keep shared media result state and generation functions.

**Tech Stack:** Vue 3, Vite 5, FFmpeg WebAssembly, Node assertion scripts, Python Playwright smoke checks.

---

## Task 1: Media Type Helper

- [ ] Add tests to `scripts/check-media-utils.mjs` for `getMediaKind`, `inferMediaType`, and `isSupportedForWorkflow`.
- [ ] Run `node scripts/check-media-utils.mjs` and confirm it fails because `src/utils/mediaTypes.js` does not exist.
- [ ] Create `src/utils/mediaTypes.js` with animated image/video extension and MIME classification.
- [ ] Run `node scripts/check-media-utils.mjs` and confirm it passes.

## Task 2: Split Vue Tabs

- [ ] Import media type helpers in `src/App.vue`.
- [ ] Replace the sidebar `动画/视频取模` tab with `动图取模` and `视频取模`.
- [ ] Change the media template condition to render for `animatedImage` and `video`.
- [ ] Make title, description, accept filter, upload hint, generate button, result title, and errors depend on the current workflow.
- [ ] Validate files with `isSupportedForWorkflow`.
- [ ] Set workflow defaults when switching tabs or uploading.

## Task 3: Verification

- [ ] Run `node scripts/check-media-utils.mjs`.
- [ ] Run `node scripts/check-export-bugs.mjs`.
- [ ] Run `npm run build`.
- [ ] Run browser smoke test for both tabs.
