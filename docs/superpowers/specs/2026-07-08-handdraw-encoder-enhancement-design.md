# Handdraw Encoder Enhancement Design

## Goal

Make the `#/handdraw` page use the same shared modulo encoding options as the other pages.

## Scope

This batch enhances the existing hand-drawn pixel page. It adds scan direction, bit order, positive/negative polarity, and output format selection for C array, HEX bytes, and binary download. It keeps the existing drawing tools, colors, preview, history, fill, eyedropper, and symmetry behavior.

## Architecture

`src/stores/pixelStore.ts` continues to own the hand-draw canvas state. It converts colored pixels into a `Uint8Array` bitmap and delegates byte packing to `bitmapEncoder`. It delegates C source formatting and blob output to `outputFormatter`.

The UI remains split across existing handdraw components. `OutputPanel.vue` owns output format, copy, and download controls. `RightPanel.vue` adds compact encoding settings near preview/layers without changing the page into a different layout.

## Behavior

Drawing updates the bitmap and output immediately. Users can switch scan direction, bit order, polarity, and output format. Copy copies the currently selected output. Download saves either `.h`, `.hex.txt`, or `.bin` depending on output format.

## Testing

Vitest covers shared encoder use from the pixel store, polarity and bit order changes, HEX output, binary blob generation, and handdraw page smoke controls.
