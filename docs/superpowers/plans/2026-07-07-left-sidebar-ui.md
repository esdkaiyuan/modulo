# Left Sidebar UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the left sidebar into a compact, grouped, maintainable tool surface.

**Architecture:** Keep behavior in the existing Vue components and add semantic class boundaries for navigation and settings groups. CSS stays in `src/App.vue` because the project already centralizes app styling there.

**Tech Stack:** Vue 3 single-file components, Vite, Node.js check scripts.

---

### Task 1: Sidebar Structure Check

**Files:**
- Create: `scripts/check-left-sidebar-ui.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing structure check**

Create `scripts/check-left-sidebar-ui.mjs` that reads `src/App.vue`, `src/components/ModuloSettingsPanel.vue`, and `src/components/PresetSelector.vue`, then asserts these strings exist:

```js
const requiredAppMarkers = [
  'sidebar-section',
  'nav-section-label',
  'workflow-nav',
  'media-nav-group',
  'width: 300px;',
  '.nav-item.active::before',
]
const requiredSettingsMarkers = [
  'settings-panel-title',
  'settings-group',
  'settings-group-title',
  '预设',
  '画布',
  '颜色/编码',
  '扫描/变换',
  '字体',
]
const requiredPresetMarkers = [
  'preset-selector',
]
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node scripts/check-left-sidebar-ui.mjs`

Expected: FAIL because the new markers do not exist yet.

- [ ] **Step 3: Add package script**

Add `"check:sidebar-ui": "node scripts/check-left-sidebar-ui.mjs"` to `package.json`.

### Task 2: Implement Sidebar UI

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/ModuloSettingsPanel.vue`
- Modify: `src/components/PresetSelector.vue`

- [ ] **Step 1: Add grouped navigation markup**

Wrap the nav menu in a `sidebar-section`, add `nav-section-label`, and add `workflow-nav` plus `media-nav-group` classes while preserving all click handlers.

- [ ] **Step 2: Add grouped settings markup**

Wrap settings in `settings-group` blocks with `settings-group-title` labels: preset, canvas, color/output, scan/transform, and font settings. Keep all model bindings and emitted events unchanged.

- [ ] **Step 3: Add compact professional CSS**

Update the sidebar CSS to use a 300px desktop sidebar, 40px nav rows, active left indicator, restrained borders, compact form controls, and mobile horizontal navigation.

- [ ] **Step 4: Run checks**

Run:

```bash
npm run check:sidebar-ui
node scripts/check-export-bugs.mjs
npm run build
```

Expected: all commands exit 0.

### Task 3: Full Verification And Commit

**Files:**
- All changed files.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run check:golden
npm run check:modulo
npm run check:formatters
node scripts/check-media-utils.mjs
npm run check:sidebar-ui
node scripts/check-export-bugs.mjs
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Commit and push**

Run:

```bash
git add docs/superpowers/specs/2026-07-07-left-sidebar-ui-design.md docs/superpowers/plans/2026-07-07-left-sidebar-ui.md package.json scripts/check-left-sidebar-ui.mjs src/App.vue src/components/ModuloSettingsPanel.vue src/components/PresetSelector.vue
git commit -m "style: refine left sidebar ui"
git push origin feature/modulo-engine-upgrade
```
