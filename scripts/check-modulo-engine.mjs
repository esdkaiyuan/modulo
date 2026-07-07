import assert from 'node:assert/strict'
import {
  convertImageDataToModulo,
  renderModuloToRgba,
} from '../src/core/moduloEngine.js'
import { iteratePixels } from '../src/core/scanOrder.js'

const imageData = (width, height, rgba) => ({
  width,
  height,
  data: new Uint8ClampedArray(rgba),
})

const rgba2x2 = imageData(2, 2, [
  255, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 255, 255, 255, 255, 255, 255,
])

assert.deepEqual(
  convertImageDataToModulo(rgba2x2, {
    width: 2,
    height: 2,
    colorFormat: 'RGB332',
    scanLayout: 'row',
  }).data,
  [0xE0, 0x1C, 0x03, 0xFF],
)

assert.deepEqual(
  convertImageDataToModulo(rgba2x2, {
    width: 2,
    height: 2,
    colorFormat: 'RGB565',
    byteOrder: 'big',
    scanLayout: 'row',
  }).data,
  [0xF8, 0x00, 0x07, 0xE0, 0x00, 0x1F, 0xFF, 0xFF],
)

assert.deepEqual(
  convertImageDataToModulo(rgba2x2, {
    width: 2,
    height: 2,
    colorFormat: 'RGB565',
    byteOrder: 'little',
    scanLayout: 'row',
  }).data,
  [0x00, 0xF8, 0xE0, 0x07, 0x1F, 0x00, 0xFF, 0xFF],
)

assert.deepEqual(
  convertImageDataToModulo(rgba2x2, {
    width: 2,
    height: 2,
    colorFormat: 'BGR565',
    byteOrder: 'big',
    scanLayout: 'row',
  }).data,
  [0x00, 0x1F, 0x07, 0xE0, 0xF8, 0x00, 0xFF, 0xFF],
)

const mono2x2 = imageData(2, 2, [
  0, 0, 0, 255, 255, 255, 255, 255,
  255, 255, 255, 255, 0, 0, 0, 255,
])

assert.deepEqual(
  convertImageDataToModulo(mono2x2, {
    width: 2,
    height: 2,
    colorFormat: 'MONO1',
    monoPolarity: 'yin',
    bitOrder: 'msb',
    scanLayout: 'row',
    threshold: 128,
  }).data,
  [0b10000000, 0b01000000],
)

assert.deepEqual(
  convertImageDataToModulo(mono2x2, {
    width: 2,
    height: 2,
    colorFormat: 'MONO1',
    monoPolarity: 'yang',
    bitOrder: 'msb',
    scanLayout: 'row',
    threshold: 128,
  }).data,
  [0b01000000, 0b10000000],
)

assert.deepEqual(
  convertImageDataToModulo(mono2x2, {
    width: 2,
    height: 2,
    colorFormat: 'MONO1',
    monoPolarity: 'yin',
    bitOrder: 'lsb',
    scanLayout: 'column',
    threshold: 128,
  }).data,
  [0b00000001, 0b00000010],
)

assert.deepEqual(
  Array.from(iteratePixels(2, 2, { scanLayout: 'row' })),
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
)

assert.deepEqual(
  Array.from(iteratePixels(2, 2, { scanLayout: 'column' })),
  [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
)

assert.deepEqual(
  Array.from(iteratePixels(2, 2, { scanLayout: 'row', flipX: true })),
  [
    { x: 1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ],
)

assert.deepEqual(
  Array.from(iteratePixels(2, 2, { scanLayout: 'row', rotation: 180 })),
  [
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: 0 },
  ],
)

const rendered = renderModuloToRgba([0x00, 0x1F], {
  width: 1,
  height: 1,
  colorFormat: 'BGR565',
  byteOrder: 'big',
})
assert.deepEqual(Array.from(rendered.data), [255, 0, 0, 255])

const result = convertImageDataToModulo(rgba2x2, {
  width: 2,
  height: 2,
  colorFormat: 'RGB888',
  scanLayout: 'row',
})
assert.equal(result.width, 2)
assert.equal(result.height, 2)
assert.equal(result.colorFormat, 'RGB888')
assert.equal(result.bytesPerFrame, 12)
assert.equal(result.data.length, 12)
