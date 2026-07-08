# Video Modulo Real Function Design

## Goal

Make the `#/video` page extract frames from a browser video file and generate dot-matrix animation data.

## Scope

This batch supports local video upload, browser `<video>` playback metadata, Canvas frame capture, sampling by time interval, target width/height, threshold, brightness, contrast, dithering, scan direction, bit order, polarity, sampled frame strip, dot-matrix preview, generated C header output, copy, and download.

FFmpeg.wasm, hardware codec controls, audio, and background worker extraction are out of scope for this batch.

## Architecture

`src/features/video/stores/videoModuloStore.ts` owns uploaded video metadata, extracted frame data, processing settings, processed frames, generated output, and selection. `src/features/video/utils/videoFrameExtractor.ts` isolates browser video seeking and Canvas frame capture. Processing reuses `imageProcessor`, `bitmapEncoder`, and text blob output utilities.

## Behavior

Users upload a video. The page displays metadata and preview playback. Users set start/end time and sampling FPS. Extraction seeks through the video, captures frames to `ImageData`, processes each frame into bitmap bytes, and generates a C header with frame arrays and timing metadata.

## Testing

Vitest covers processing injected frames, sampling metadata, generated source, selected frame state, and page smoke controls.
