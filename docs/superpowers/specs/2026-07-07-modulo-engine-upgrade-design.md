# Modulo Engine Upgrade Design

## Goal

Upgrade the tool into a maintainable, preset-driven LCD modulo workbench. Text, images, batch text, hand drawing, animated images, and video should all use the same tested conversion engine while supporting the color formats, scan rules, byte order rules, and presets required by the local LCD technical specification and common modulo tools.

## Current Context

The project is a Vue 3 + Vite single-page app. Most behavior currently lives in `src/App.vue`, which contains template, state, conversion logic, export logic, and CSS in one large file. Some reusable logic already exists in `src/utils/`:

- `modulo.js` handles one-bit packing helpers.
- `imageModulo.js` handles mono and limited color image packing.
- `mediaExtractor.js` extracts GIF/APNG/video frames with browser APIs and small decoding libraries.
- `animationFormatters.js` outputs animation-oriented C code.
- `mediaTypes.js` detects basic animated image and video types.

The referenced technical specification requires explicit support for RGB332, RGB565, BGR565, byte order, row/column data layout, scan direction, coordinate origin, and common ILI9341/ST7789 color-order pitfalls. The upgrade should preserve existing workflows while replacing duplicated conversion loops with shared pure modules.

## Scope

### In Scope

- Split conversion, preset, media, formatter, and UI concerns into separate files.
- Replace duplicated text, image, batch, draw, animated image, and video packing logic with one core engine.
- Add preset-driven settings for:
  - Wisdom Life V3.0 / STM32F405 / ILI9341
  - PCtoLCD2002-compatible mono OLED/LCD
  - LVGL image output
  - Arduino TFT image output
  - generic one-bit OLED bitmap output
- Support color formats:
  - `MONO1`
  - `GRAY2`
  - `GRAY4`
  - `GRAY8`
  - `RGB332`
  - `RGB565`
  - `BGR565`
  - `RGB888`
  - `BGR888`
  - `ARGB8888`
  - `RGBA8888`
- Support custom settings:
  - width and height
  - resize mode: stretch, contain, cover, crop center, pad
  - background color
  - transparent pixel handling
  - threshold
  - optional ordered dithering for mono and low-bit color formats
  - mono polarity: yin code and yang code
  - bit order: MSB first and LSB first
  - byte order for multi-byte colors: big endian and little endian
  - scan layout: row-major and column-major
  - scan direction: left-to-right, right-to-left, top-to-bottom, bottom-to-top
  - coordinate origin: top-left and bottom-left
  - rotation: 0, 90, 180, 270 degrees
  - horizontal and vertical flip
- Support more image/media input formats where browser or local decoders can reasonably handle them:
  - images: PNG, JPG/JPEG, BMP, GIF, WebP, APNG, SVG image import through browser rasterization, AVIF when browser supported, ICO when parsed by helper or accepted by browser
  - animated images: GIF, APNG, animated WebP when supported
  - video: MP4, WebM, MOV, M4V, OGV when browser supported
- Add export formats:
  - hex text
  - binary text
  - C array
  - C header
  - LVGL image descriptor
  - Arduino PROGMEM array
  - raw `.bin`
- Add focused tests for conversion behavior before implementation changes.

### Out Of Scope

- Server-side media processing.
- FFmpeg WebAssembly bundling.
- Audio extraction.
- Timeline editing, subtitles, effects, or video compositing.
- Font file parsing such as TTF/OTF glyph extraction beyond the current canvas-rendered text workflow.
- Rebuilding the visual design from scratch.

## Architecture

### Module Boundaries

The app should move toward this structure:

```text
src/
  App.vue
  components/
    AppShell.vue
    TextModuloPanel.vue
    ImageModuloPanel.vue
    BatchModuloPanel.vue
    DrawModuloPanel.vue
    MediaModuloPanel.vue
    ModuloSettingsPanel.vue
    PresetSelector.vue
    OutputPanel.vue
    PreviewCanvas.vue
  composables/
    useModuloConfig.js
    useModuloResult.js
    useMediaFrames.js
    useCanvasDrawing.js
  core/
    bitmapPipeline.js
    colorPacking.js
    monoPacking.js
    scanOrder.js
    presets.js
    moduloEngine.js
    validators.js
  formatters/
    cArrayFormatter.js
    lvglFormatter.js
    arduinoFormatter.js
    binaryFormatter.js
  media/
    imageDecoder.js
    bmpDecoder.js
    icoDecoder.js
    mediaExtractor.js
    mediaTypes.js
  utils/
    download.js
    clipboard.js
```

`App.vue` should become a shell that owns top-level navigation and passes configuration/result state to smaller panels. Pure conversion logic should live outside Vue components so it can be tested with Node scripts.

### Data Flow

Each workflow follows the same pipeline:

```text
input source
  -> normalized bitmap frame(s)
  -> bitmap transform pipeline
  -> scan-order iterator
  -> format-specific packer
  -> preview renderer
  -> selected formatter/exporter
```

Text, batch text, and hand drawing produce a canvas-backed bitmap. Static image upload produces one bitmap frame. Animated image and video upload produce many bitmap frames. After that, all workflows call the same engine.

## Core Configuration Model

Use one serializable configuration object:

```js
{
  presetId: 'wisdom-ili9341-bgr565',
  width: 240,
  height: 240,
  resizeMode: 'contain',
  backgroundColor: '#000000',
  transparentMode: 'blendBackground',
  threshold: 128,
  dithering: 'none',
  colorFormat: 'BGR565',
  monoPolarity: 'yin',
  bitOrder: 'msb',
  byteOrder: 'big',
  scanLayout: 'column',
  primaryDirection: 'forward',
  secondaryDirection: 'forward',
  origin: 'top-left',
  rotation: 0,
  flipX: false,
  flipY: false,
  outputFormat: 'c-array'
}
```

Settings that only apply to some formats should remain visible but disabled or hidden with concise labels. For example, `monoPolarity` and `bitOrder` apply to `MONO1`, while `byteOrder` applies to RGB565/BGR565 and 32-bit formats.

## Presets

### Wisdom Life V3.0 / ILI9341

Purpose: match the local technical specification for STM32F405 and ILI9341/ST7789-style TFT screens.

Default values:

```js
{
  id: 'wisdom-ili9341-bgr565',
  label: '智慧生活 V3.0 / ILI9341 BGR565',
  width: 240,
  height: 240,
  colorFormat: 'BGR565',
  byteOrder: 'big',
  scanLayout: 'column',
  origin: 'top-left',
  outputFormat: 'c-array'
}
```

Also provide a related `RGB565` preset for firmware that sets LCD MADCTL BGR bit differently.

### PCtoLCD2002 Mono

Purpose: match common Chinese mono bitmap tools.

Provide variants for:

- 16x16 Chinese font
- 32x32 Chinese font
- 128x64 OLED bitmap

Settings include `MONO1`, yin/yang code, MSB/LSB, row/column layout, and C array output.

### LVGL

Purpose: generate image descriptors usable in LVGL-style projects.

Provide variants for:

- RGB565
- RGB888
- ARGB8888

Output should include width, height, color format marker text, data array, and descriptor-style metadata.

### Arduino TFT

Purpose: generate copy-ready arrays for common Arduino display libraries.

Default to RGB565, big endian byte output, row-major scan, and `PROGMEM`.

### Generic OLED

Purpose: generate compact one-bit bitmaps for SSD1306/SH1106-style displays.

Default variants should include both 128x64 row-major byte packing and SSD1306-style 8-pixel vertical page packing. Both variants use `MONO1`, MSB-first, and binary/hex output.

## Conversion Rules

### Color Packing

RGB332:

- red: top 3 bits
- green: top 3 bits
- blue: top 2 bits
- pure red `255,0,0` outputs `0xE0`
- pure green `0,255,0` outputs `0x1C`
- pure blue `0,0,255` outputs `0x03`
- white outputs `0xFF`

RGB565:

- layout `RRRRRGGGGGGBBBBB`
- pure red outputs `0xF800`
- pure green outputs `0x07E0`
- pure blue outputs `0x001F`
- white outputs `0xFFFF`
- byte order controls whether output bytes are high-byte first or low-byte first

BGR565:

- channel order swaps red and blue relative to RGB565.
- layout `BBBBBGGGGGGRRRRR`.
- pure red outputs `0x001F`.
- pure green outputs `0x07E0`.
- pure blue outputs `0xF800`.
- white outputs `0xFFFF`.
- preview rendering must decode using the selected format so red/blue swaps are visible during testing.

RGB888/BGR888:

- output three bytes per pixel in selected channel order.

ARGB8888/RGBA8888:

- output four bytes per pixel in selected channel order.
- transparent input pixels should either preserve alpha or blend against `backgroundColor`, based on `transparentMode`.

### Mono Packing

The mono engine should support:

- threshold-based conversion
- yin code: lit pixel writes bit `1`
- yang code: lit pixel writes bit `0`
- MSB-first and LSB-first bit placement
- row-major byte groups
- column-major byte groups

Text, batch text, hand drawing, and one-bit image outputs must use this same packer.

### Scan Order And Geometry

Scan order should be represented as an iterator over source pixel coordinates. It should account for:

- row-major versus column-major layout
- primary and secondary direction
- top-left versus bottom-left origin
- rotation
- horizontal and vertical flip

The packers should not contain geometry-specific loops beyond consuming ordered pixels.

## Media Support

### Image Decoding

Use browser decoding first for PNG, JPEG, WebP, AVIF, SVG, and other natively supported formats. Add small helper decoders only where valuable:

- BMP: parse common uncompressed 24-bit and 32-bit BMP files.
- ICO: select a suitable embedded image when simple parsing is possible, otherwise fall back to browser decoding.

If a format cannot be decoded in the current browser, show an actionable error instead of silently producing empty output.

### Animated Image And Video Extraction

Keep the current lightweight browser-first approach:

- GIF via `gifuct-js`
- APNG via `upng-js`
- animated WebP via `ImageDecoder` when available
- video via HTMLVideoElement seeking

Add controls for:

- FPS
- maximum frames
- start time
- end time
- custom frame delay
- frame size estimate

Do not add FFmpeg WebAssembly in this upgrade, because browser extraction covers the stated scope while keeping package size and loading cost low.

## UI Design

The UI should be split into feature panels. Each panel owns only the input-specific controls and calls shared composables.

`ModuloSettingsPanel.vue` should group settings into:

- Preset
- Canvas size and resize
- Color and encoding
- Scan and transform
- Output

Each advanced setting should have a sensible default from the selected preset. Users can modify settings after selecting a preset, and the UI should mark the configuration as customized.

`OutputPanel.vue` should be reused by all workflows and show:

- preview
- byte count
- selected output text
- copy button
- download buttons

## Error Handling

Show clear messages for:

- unsupported file format
- decode failure
- invalid width/height
- impossible byte layout
- empty text input
- no media frames extracted
- output size too large for current browser memory

Keep user inputs and settings after an error so the user can adjust and retry.

## Testing Strategy

Follow test-first implementation for core behavior.

Add or extend Node script checks for:

- RGB332 pure color outputs
- RGB565 and BGR565 pure color outputs
- big-endian and little-endian byte order
- mono yin/yang polarity
- MSB/LSB bit order
- row-major and column-major scan
- horizontal flip, vertical flip, and 180-degree rotation
- preset default values
- LVGL and Arduino formatter output markers
- existing export link cleanup behavior

Browser verification should check:

- each panel renders
- preset selection updates settings
- static image conversion works
- text and batch conversion use the shared engine
- hand drawing conversion uses the shared engine
- animated image/video conversion uses the shared engine
- production build succeeds

## Migration Plan

Implementation should proceed in small slices:

1. Add tested pure core modules while leaving existing UI unchanged.
2. Add presets and formatters with tests.
3. Refactor image conversion to the new engine.
4. Refactor text and batch conversion.
5. Refactor hand drawing conversion.
6. Refactor animated image and video conversion.
7. Split UI panels out of `App.vue`.
8. Remove old duplicated conversion helpers after all workflows use the new engine.

This order keeps the app buildable after each step and avoids a one-shot rewrite.

## Acceptance Criteria

- `App.vue` no longer contains the main conversion loops for text, image, batch, draw, animated image, or video.
- All workflows share the same modulo engine.
- Users can select project-specific, PCtoLCD2002, LVGL, Arduino, and generic OLED presets.
- RGB332, RGB565, BGR565, RGB888, BGR888, ARGB8888, RGBA8888, and mono output paths work.
- Byte order, bit order, scan layout, origin, flip, and rotation settings affect output consistently.
- More image/video formats are accepted when the browser or helper decoder supports them.
- Unsupported formats fail with a clear message.
- Export formats include C array, C header, LVGL descriptor, Arduino PROGMEM, hex text, binary text, and raw binary.
- Focused automated checks pass.
- `npm run build` succeeds.
