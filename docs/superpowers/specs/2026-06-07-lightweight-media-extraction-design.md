# Lightweight Media Extraction Design

## Goal

Remove the slow FFmpeg WebAssembly dependency from animated image and video modulo workflows. Replace it with browser-native extraction so first use no longer downloads or initializes a 32 MB wasm core.

## Design

- Animated images use browser `ImageDecoder` when available.
- If `ImageDecoder` cannot decode the animated image, fall back to one static frame via `createImageBitmap`.
- Videos use native `<video>` seeking plus canvas capture.
- Existing frame conversion, previews, copy, and export logic remain unchanged.

## Scope

In scope:

- Remove `@ffmpeg/ffmpeg`, `@ffmpeg/util`, and `@ffmpeg/core`.
- Replace `src/utils/mediaExtractor.js` with browser-native extraction.
- Update progress labels from FFmpeg-specific wording to media decoding wording.
- Keep `动图取模` and `视频取模` split.

Out of scope:

- Guaranteed animated WebP/APNG decoding in browsers without `ImageDecoder`.
- Server-side decoding.
- Audio handling.

## Acceptance Criteria

- No `@ffmpeg/*` dependencies remain in `package.json`.
- Build output no longer contains FFmpeg worker chunks.
- `动图取模` and `视频取模` tabs still render.
- Existing utility and export checks pass.
- Production build passes.
