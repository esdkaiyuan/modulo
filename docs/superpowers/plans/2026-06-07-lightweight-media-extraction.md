# Lightweight Media Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace FFmpeg WebAssembly extraction with browser-native animated image and video frame extraction.

**Architecture:** Keep the existing app-facing `extractMediaFrames(file, options)` API. Reimplement internals using `ImageDecoder`/`createImageBitmap` for animated images and `<video>` seeking/canvas capture for videos.

**Tech Stack:** Vue 3, Vite 5, browser ImageDecoder, HTMLVideoElement, Canvas, Node verification scripts.

---

## Tasks

- [ ] Add a test that asserts `src/utils/mediaExtractor.js` has no `@ffmpeg` imports and exports extraction helpers.
- [ ] Replace `src/utils/mediaExtractor.js` with browser-native extraction.
- [ ] Remove `@ffmpeg/*` dependencies with `npm uninstall`.
- [ ] Update FFmpeg-specific UI status labels.
- [ ] Run `node scripts/check-media-utils.mjs`.
- [ ] Run `node scripts/check-export-bugs.mjs`.
- [ ] Run `npm run build`.
- [ ] Run browser smoke test for `动图取模` and `视频取模`.
