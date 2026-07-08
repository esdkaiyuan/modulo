# Image Modulo Real Function Design

## Goal

Make the `#/image` page usable with real image modulo extraction instead of mock data.

## Scope

This batch covers single-image extraction only. It supports image upload, browser Canvas decoding, grayscale conversion, brightness and contrast adjustment, thresholding, nearest-neighbor scaling, optional Floyd-Steinberg dithering, dot-matrix preview, C-array output, copy, and download.

Batch processing, font rendering, GIF extraction, video extraction, and hand-draw encoder enhancements are intentionally left for later batches.

## Architecture

Pure processing stays in `src/engines` so later pages can reuse it. The image page owns its feature state in `src/features/image/stores/imageModuloStore.ts`. Vue components bind to that store and render previews from the processed bitmap.

## Files

- `src/engines/imageProcessor.ts`: RGBA to grayscale, brightness/contrast adjustment, nearest-neighbor resize, thresholding, dithering, and image-data to bitmap conversion.
- `src/engines/bitmapEncoder.ts`: shared bitmap-to-byte encoding options.
- `src/engines/outputFormatter.ts`: C-array formatting and binary download blob creation.
- `src/features/image/stores/imageModuloStore.ts`: image page state, processing pipeline, and generated output.
- `src/features/image/components/*.vue`: replace mock values with store-backed controls and upload/export actions.

## Behavior

Users upload an image from the image page. The browser decodes it into `ImageData`, the store processes it into a target-width by target-height bitmap, and the preview and generated C array update when processing settings change. Copy writes the generated source to the clipboard. Download saves the generated C source as a `.h` file.

## Testing

Vitest covers pure image processing, bitmap encoding, output formatting, and image store processing with synthetic image data.
