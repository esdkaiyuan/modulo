# Overall UI Polish Design

## Goal

Improve the modulo tool's overall UI quality while preserving the existing blue, green, white, and gray color identity.

## Scope

This pass changes presentation and component structure only. It must not change modulo algorithms, decoding, export data, presets, or workflow state.

## Design

- Keep the app as a dense engineering tool, not a marketing page.
- Add reusable UI components for repeated app surfaces:
  - `SectionCard`: unified panel container with title, description, and action slot.
  - `UploadDropzone`: shared upload/drop visual surface for image and media workflows.
  - `ResultToolbar`: compact action row for copy/export buttons.
  - `StatusSummary`: concise status metric strip for current size, color format, scan mode, output format, and preset.
- Use the current palette: blue for active/action, green as secondary accent, white panels, gray borders/text.
- Reduce animated decorative effects in primary work areas and make hover states restrained.
- Improve scanability with consistent card headers, spacing, button heights, tab styling, result blocks, upload zones, and data panels.
- Keep mobile layouts single-column with horizontal tabs/actions where needed.

## Files

- `src/components/SectionCard.vue`: reusable card shell.
- `src/components/UploadDropzone.vue`: reusable upload affordance.
- `src/components/ResultToolbar.vue`: reusable result action row.
- `src/components/StatusSummary.vue`: reusable summary metrics.
- `src/App.vue`: use new components in key workflows and extend shared styles.
- `scripts/check-overall-ui-polish.mjs`: structure check for component adoption and style guard.

## Verification

Run the new UI structure check, existing UI sidebar check, export guard, core algorithm checks, formatter checks, golden output checks, media utilities, and production build.
