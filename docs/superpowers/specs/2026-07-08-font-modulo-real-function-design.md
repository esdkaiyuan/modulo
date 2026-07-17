# Font Modulo Real Function Design

## Goal

Make the `#/font` page render real text into a dot matrix and generate real C-array output.

## Scope

This batch covers browser-native Canvas text rendering. It supports text input, font family, font size, bold, italic, target width/height, threshold, invert mode, scan direction, bit order, positive/negative polarity, live preview, copy, and `.h` download.

Custom TTF/OTF parsing with FreeType WASM is out of scope for this batch. Browser-installed fonts and CSS font-family names are used first.

## Architecture

`src/engines/fontRenderer.ts` contains pure Canvas-oriented rendering helpers. It renders text into `ImageData`, converts alpha/luminance to a bitmap, and can run against a provided canvas factory so it remains testable. `src/features/font/stores/fontModuloStore.ts` owns page state and delegates bitmap encoding to `bitmapEncoder` and source formatting to `outputFormatter`.

## Behavior

Users type one or more characters. The page renders the text centered in the target grid, shows a pixel preview, and generates C source. Changing style, size, target dimensions, threshold, invert, scan direction, bit order, or polarity regenerates output.

## Testing

Vitest covers font bitmap generation from synthetic image data, inversion behavior, font store output generation, and page smoke controls.
