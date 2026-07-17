# Animation Modulo Real Function Design

## Goal

Make the `#/animation` page convert real animation frames into dot-matrix frame arrays and delay arrays.

## Scope

This batch supports GIF upload and decoded frame processing. It can also accept already-decoded `ImageData` frames internally for tests. It supports frame range, sampling step, target width/height, threshold, dithering, scan direction, bit order, polarity, frame strip selection, generated frame C array, delay C array, copy, and `.h` download.

WebP/APNG decoding, worker pools, and advanced disposal-mode rendering are out of scope for this first animation batch.

## Architecture

`src/features/animation/stores/animationModuloStore.ts` owns decoded frames and processing state. It reuses `imageProcessor`, `bitmapEncoder`, and `outputFormatter` concepts. GIF file decoding is isolated in `src/features/animation/utils/gifDecoder.ts`; the store also exposes `loadDecodedFrames` so tests and future decoders can share the same processing path.

## Behavior

Users upload a GIF. The page decodes frames, stores delays, processes selected/sampled frames into target-size bitmaps, encodes each frame to bytes, and generates a header containing `anim_frames`, `anim_delays`, frame count, width, and height. The selected frame preview and filmstrip update from real processed data.

## Testing

Vitest covers frame sampling, frame processing, generated source, summary values, and page smoke controls.
