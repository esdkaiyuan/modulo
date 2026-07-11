import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const downloadComponents = [
  '../src/features/image/components/ImageOutputPanel.vue',
  '../src/features/batch/components/BatchResultsPanel.vue',
  '../src/features/animation/components/AnimationOutput.vue',
  '../src/features/video/components/VideoOutput.vue',
  '../src/features/font/components/FontOutputPanel.vue',
  '../src/features/handdraw/components/OutputPanel.vue',
  '../src/features/handdraw/components/TopBar.vue'
];

for (const component of downloadComponents) {
  const source = readFileSync(new URL(component, import.meta.url), 'utf8');
  const append = source.indexOf('document.body.appendChild(anchor)');
  const click = source.indexOf('anchor.click()');
  const remove = source.indexOf('document.body.removeChild(anchor)');
  const revoke = source.indexOf('URL.revokeObjectURL(url)');
  assert(append >= 0 && append < click, `${component} must append its link before clicking`);
  assert(remove > click, `${component} must remove its link after clicking`);
  assert(revoke > remove, `${component} must revoke its object URL after removing the link`);
}

const formatter = readFileSync(new URL('../src/engines/exportFormatter.ts', import.meta.url), 'utf8');
assert.match(formatter, /export function formatModuloC/);
assert.match(formatter, /export function formatModuloHex/);
assert.match(formatter, /export function makeModuloBlob/);
assert.match(formatter, /result\.paletteBytes\.length \+ result\.bytes\.length/);
