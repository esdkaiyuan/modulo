# PixelCraft Core Workbench Design

## Goal

Build a Vue 3 front-end for the core PixelCraft Web workbench shown in `ui示例.png`: a desktop-style pixel drawing and modulo output tool.

## Scope

This first version focuses on hand-drawn pixel modulo output. It includes the top bar, left tool panel, central pixel canvas, right color/preview/layers panels, and bottom code output panel. Text, image, batch, animation, and video import are intentionally out of scope for this phase.

## Architecture

The app uses Vue 3, Vite, TypeScript, Pinia, Canvas 2D, and Vitest. Pinia stores the canvas pixels, active tool, current color, brush size, zoom, history, and UI options. Canvas drawing updates the store; preview and C-array output derive from that same state.

## Components

- `src/App.vue`: shell layout matching the reference image.
- `src/components/TopBar.vue`: brand, canvas size selector, zoom slider, saved state, theme and export buttons.
- `src/components/ToolPanel.vue`: tools, brush sizes, and drawing options.
- `src/components/PixelCanvas.vue`: Canvas 2D pixel editing surface.
- `src/components/RightPanel.vue`: color picker, swatches, preview canvas, layers, and status.
- `src/components/OutputPanel.vue`: generated C array and copy action.

## Engines

- `src/engines/modulo.ts`: scans pixels row-by-row, converts non-empty pixels to bits, packs every 8 bits into bytes, and formats a C array.
- `src/engines/fill.ts`: flood fill for contiguous pixels of the same color.
- `src/stores/pixelStore.ts`: history-aware pixel state and tool actions.

## Interaction

Pencil writes the active color. Eraser clears pixels. Fill replaces a contiguous region. Eyedropper selects the clicked pixel color. Undo and redo move through snapshots. Grid, pixel-perfect, and symmetry are UI options in this release; grid affects canvas rendering, pixel-perfect is a stored option, and symmetry mirrors horizontal edits when enabled.

## Testing

Vitest covers modulo encoding, flood fill, history behavior, and a smoke render of the app. Browser verification confirms the workbench renders and the dev server starts.
