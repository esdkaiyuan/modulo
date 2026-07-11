import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const colorEncoder = readFileSync(new URL('../src/engines/colorEncoder.ts', import.meta.url), 'utf8');
for (const api of ['encodeRgb565', 'encodeRgb888', 'createPalette16', 'encodePalette16', 'decodePalette16', 'encodeColorImage']) {
  assert.match(colorEncoder, new RegExp(`export function ${api}\\b`), `colorEncoder must export ${api}`);
}
assert.match(colorEncoder, /paletteIndex << 4/, 'Palette16 must pack the first pixel into the high nibble');
assert.match(colorEncoder, /order === 'msb-first'/, 'RGB565 must support explicit byte order');
assert.match(colorEncoder, /order === 'rgb'/, 'RGB888 must support RGB and BGR channel order');

const imageProcessor = readFileSync(new URL('../src/engines/imageProcessor.ts', import.meta.url), 'utf8');
assert.match(imageProcessor, /export function processImageData/);
assert.match(imageProcessor, /cropWidth/);
assert.match(imageProcessor, /targetWidth/);

for (const storePath of [
  '../src/features/animation/stores/animationModuloStore.ts',
  '../src/features/video/stores/videoModuloStore.ts'
]) {
  const store = readFileSync(new URL(storePath, import.meta.url), 'utf8');
  assert.match(store, /createPalette16\(/, `${storePath} must build a shared palette`);
  assert.match(store, /palette: sharedPalette|palette \}/, `${storePath} must reuse the shared palette for each frame`);
}
