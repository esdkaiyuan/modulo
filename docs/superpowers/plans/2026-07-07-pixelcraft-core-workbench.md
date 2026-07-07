# PixelCraft Core Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue 3 pixel drawing workbench with live C-array modulo output.

**Architecture:** Use Pinia as the single source of truth for pixels and UI state. Keep pure algorithms in `src/engines`, visual surfaces in Vue components, and styling in `src/style.css`.

**Tech Stack:** Vue 3, Vite, TypeScript, Pinia, Vitest, Vue Test Utils, Canvas 2D.

---

### Task 1: Project Shell And Failing Tests

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/tests/engines.test.ts`
- Create: `src/tests/pixelStore.test.ts`
- Create: `src/tests/app.test.ts`

- [ ] Create package and config files for Vue, Vite, TypeScript, and Vitest.
- [ ] Write tests for C-array formatting, flood fill, history undo/redo, and app rendering before production code exists.
- [ ] Run `npm test -- --run` and verify tests fail because source modules are missing.

### Task 2: Pure Engines

**Files:**
- Create: `src/engines/modulo.ts`
- Create: `src/engines/fill.ts`

- [ ] Implement `pixelsToBits`, `packBitsToBytes`, `formatCArray`, and `floodFill`.
- [ ] Run `npm test -- --run src/tests/engines.test.ts` and verify engine tests pass.

### Task 3: Store

**Files:**
- Create: `src/stores/pixelStore.ts`

- [ ] Implement Pinia state for pixels, tools, colors, options, history, and derived output.
- [ ] Run `npm test -- --run src/tests/pixelStore.test.ts` and verify store tests pass.

### Task 4: Vue Workbench

**Files:**
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/components/TopBar.vue`
- Create: `src/components/ToolPanel.vue`
- Create: `src/components/PixelCanvas.vue`
- Create: `src/components/RightPanel.vue`
- Create: `src/components/OutputPanel.vue`
- Create: `src/style.css`

- [ ] Implement the reference-image workbench layout and interactions.
- [ ] Run `npm test -- --run` and verify all tests pass.
- [ ] Run `npm run build` and verify production build succeeds.
- [ ] Start `npm run dev -- --host 127.0.0.1` and provide the local URL.
