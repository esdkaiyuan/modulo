# Overall UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the app's overall UI with reusable interface components while preserving the existing color style and all modulo behavior.

**Architecture:** Add small presentational Vue components for repeated surfaces, then adopt them in the most visible input/result areas. Keep algorithm and state code unchanged.

**Tech Stack:** Vue 3 single-file components, Vite, Node.js check scripts.

---

### Task 1: UI Structure Check

**Files:**
- Create: `scripts/check-overall-ui-polish.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing check**

Create a Node script that asserts the new component files exist and that `App.vue` imports and uses `SectionCard`, `UploadDropzone`, `ResultToolbar`, and `StatusSummary`.

- [ ] **Step 2: Verify the check fails**

Run: `node scripts/check-overall-ui-polish.mjs`

Expected: exit 1 because the components do not exist yet.

- [ ] **Step 3: Add npm script**

Add `"check:ui-polish": "node scripts/check-overall-ui-polish.mjs"` to `package.json`.

### Task 2: Presentational Components

**Files:**
- Create: `src/components/SectionCard.vue`
- Create: `src/components/UploadDropzone.vue`
- Create: `src/components/ResultToolbar.vue`
- Create: `src/components/StatusSummary.vue`

- [ ] **Step 1: Build components**

Create lightweight components with slots and props only. They must not import modulo engine code.

- [ ] **Step 2: Use components in `App.vue`**

Replace the most visible input/result wrapper markup for text, image, media, batch, and draw workflows with `SectionCard`; replace image/media upload surfaces with `UploadDropzone`; replace result action groups with `ResultToolbar`; add `StatusSummary` near the top of the main content.

### Task 3: Shared Styling

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Add shared classes**

Add style rules for `.section-card`, `.section-card-header`, `.status-summary`, `.upload-dropzone`, `.result-toolbar`, and refined button/tab/data surfaces.

- [ ] **Step 2: Keep palette stable**

Use existing colors only: `#4A90E2`, `#66BB6A`, white, gray slate, and existing semantic warning/error colors.

### Task 4: Verification And Commit

**Files:**
- All changed files.

- [ ] **Step 1: Run verification**

Run:

```bash
npm run check:ui-polish
npm run check:sidebar-ui
node scripts/check-export-bugs.mjs
npm run check:golden
npm run check:modulo
npm run check:formatters
node scripts/check-media-utils.mjs
npm run build
git diff --check
```

Expected: all commands exit 0 except `git diff --check` may print CRLF warnings but no whitespace errors.

- [ ] **Step 2: Commit and push**

Run:

```bash
git add .
git commit -m "style: polish overall tool ui"
git push origin feature/modulo-engine-upgrade
```
