# Split Animated Image And Video Modulo Design

## Goal

Split the existing combined `动画/视频取模` workflow into two clearer tabs:

- `动图取模`
- `视频取模`

Both workflows keep the same FFmpeg-backed extraction, frame-to-modulo conversion, preview, copy, and export pipeline.

## Scope

### Animated Image Modulo

Supports animated image files:

- GIF
- APNG or `.png`
- animated WebP or `.webp`

If an uploaded PNG contains only one frame, treat it as a one-frame animation so users can still export animation-style C data.

Defaults:

- extraction mode: max frame count
- max frames: 64
- frame delay: 200 ms

### Video Modulo

Supports video files:

- MP4
- WebM
- MOV/M4V

Defaults:

- extraction mode: FPS plus max frame count
- FPS: 5
- max frames: 64
- frame delay: derived from FPS

## UI Design

The sidebar shows two separate entries:

```text
动图取模
视频取模
```

Each tab has separate upload copy and accept filters. The settings panel remains shared for width, height, scan mode, encoding mode, byte order, and threshold.

The result UI remains shared:

- original media preview
- extracted frame thumbnails
- dot-matrix animation preview
- output tabs: per-frame arrays, animation struct, raw hex
- copy current format
- export `.c`
- export `.h`

## Implementation Notes

Use a small media type helper to avoid duplicating extension and MIME checks inside `App.vue`.

Suggested helper API:

```js
getMediaKind(file) // 'animatedImage' | 'video' | 'unsupported'
inferMediaType(file)
isSupportedForWorkflow(file, workflow)
```

`workflow` is either `animatedImage` or `video`.

The existing media state can be reused by both tabs. Selecting a file should know the current workflow and validate against that workflow only.

## Acceptance Criteria

- Sidebar contains `动图取模` and `视频取模`, not `动画/视频取模`.
- `动图取模` accepts GIF, PNG/APNG, and WebP.
- `视频取模` accepts MP4, WebM, MOV, and M4V.
- Wrong file type gives a workflow-specific message.
- Both tabs can use the existing extraction, preview, copy, and export paths.
- Existing tests and production build pass.
