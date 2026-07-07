# Left Sidebar UI Design

## Goal

Upgrade the left side of the modulo tool into a compact, professional tool sidebar while keeping all existing workflows and settings available.

## Approved Approach

Use a dense production-tool layout:
- Keep the sidebar as the first-screen command surface.
- Group navigation under a small workflow heading.
- Group configuration into clear sections: preset, canvas, color/output, scan/transform, and font settings.
- Keep the visual language restrained: 300px desktop sidebar, 40px navigation rows, subtle active indicator, light borders, fewer shadows, no decorative animation.
- Preserve the mobile behavior with horizontal navigation and single-column settings.

## Scope

Change only the left sidebar and settings panel structure/styling. Do not alter modulo algorithms, output generation, media decoding, or data flow.

## Components

- `src/App.vue`: sidebar shell, navigation grouping, and sidebar CSS.
- `src/components/ModuloSettingsPanel.vue`: semantic settings groups and section titles.
- `src/components/PresetSelector.vue`: a style hook for preset grouping.
- `scripts/check-left-sidebar-ui.mjs`: structure check that verifies the sidebar contract.

## Testing

Run the new sidebar structure check, existing export guard, modulo engine checks, formatter checks, golden checks, media utility checks, and production build.
