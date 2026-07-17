# Batch Image Modulo Real Function Design

## Goal

Make the `#/batch` page process multiple real image files using the shared image modulo engine.

## Scope

This batch covers multi-image batch processing for browser-decodable still images. It supports file selection, queue status, per-file progress, shared extraction parameters, per-file generated C arrays, merged output, processing log, summary statistics, and text download.

Directory picking, worker pools, GIF frame extraction, and video extraction are out of scope for this batch.

## Architecture

`src/features/batch/stores/batchModuloStore.ts` owns the batch queue. Each queued item stores image metadata, decoded image data, status, progress, generated bitmap, bytes, source code, and error messages. It reuses `imageProcessor`, `bitmapEncoder`, and `outputFormatter` from the image batch instead of duplicating extraction logic.

Vue components stay focused:

- `BatchFilesTable.vue`: upload, queue table, status, progress, remove/retry.
- `BatchConfigPanel.vue`: shared processing parameters.
- `BatchLogPanel.vue`: processing log and overall progress.
- `BatchResultsPanel.vue`: selected result preview, generated source, and merged download.

## Behavior

Users select several images. The page decodes each image through Canvas, stores it as a pending queue item, and processes all pending items with the shared parameters. Done items expose generated source and byte counts. Failed items keep their error message and can be retried.

## Testing

Vitest covers queue loading from synthetic `ImageData`, processing all files, summary counts, merged source generation, and component smoke rendering for upload and batch controls.
