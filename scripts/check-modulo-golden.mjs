import assert from 'node:assert/strict'
import {
  convertImageDataToModulo,
  renderModuloToRgba,
} from '../src/core/moduloEngine.js'
import { getPreset } from '../src/core/presets.js'
import {
  formatArduinoProgmem,
  formatCArray,
  formatCHeader,
  formatHexText,
  formatLvglDescriptor,
  formatRawBinary,
} from '../src/formatters/index.js'

const pixel = (r, g, b, a = 255) => ({
  width: 1,
  height: 1,
  data: new Uint8ClampedArray([r, g, b, a]),
})

const packOne = (rgba, config) => convertImageDataToModulo(rgba, {
  width: 1,
  height: 1,
  scanLayout: 'row',
  ...config,
}).data

const pureColors = [
  ['red', pixel(255, 0, 0), {
    RGB332: [0xE0],
    RGB565: [0xF8, 0x00],
    BGR565: [0x00, 0x1F],
  }],
  ['green', pixel(0, 255, 0), {
    RGB332: [0x1C],
    RGB565: [0x07, 0xE0],
    BGR565: [0x07, 0xE0],
  }],
  ['blue', pixel(0, 0, 255), {
    RGB332: [0x03],
    RGB565: [0x00, 0x1F],
    BGR565: [0xF8, 0x00],
  }],
  ['white', pixel(255, 255, 255), {
    RGB332: [0xFF],
    RGB565: [0xFF, 0xFF],
    BGR565: [0xFF, 0xFF],
  }],
]

for (const [name, rgba, expected] of pureColors) {
  assert.deepEqual(packOne(rgba, { colorFormat: 'RGB332' }), expected.RGB332, `${name} RGB332`)
  assert.deepEqual(packOne(rgba, { colorFormat: 'RGB565', byteOrder: 'big' }), expected.RGB565, `${name} RGB565 big endian`)
  assert.deepEqual(packOne(rgba, { colorFormat: 'BGR565', byteOrder: 'big' }), expected.BGR565, `${name} BGR565 big endian`)
  assert.deepEqual(
    packOne(rgba, { colorFormat: 'RGB565', byteOrder: 'little' }),
    [...expected.RGB565].reverse(),
    `${name} RGB565 little endian`,
  )
}

assert.deepEqual(
  Array.from(renderModuloToRgba([0xF8, 0x00], {
    width: 1,
    height: 1,
    colorFormat: 'RGB565',
    byteOrder: 'big',
  }).data),
  [255, 0, 0, 255],
)

assert.deepEqual(
  Array.from(renderModuloToRgba([0x00, 0x1F], {
    width: 1,
    height: 1,
    colorFormat: 'BGR565',
    byteOrder: 'big',
  }).data),
  [255, 0, 0, 255],
)

const checker = {
  width: 8,
  height: 2,
  data: new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255,
    0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255,
    255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255,
  ]),
}

assert.deepEqual(
  convertImageDataToModulo(checker, {
    width: 8,
    height: 2,
    colorFormat: 'MONO1',
    monoPolarity: 'yin',
    bitOrder: 'msb',
    scanLayout: 'row',
    threshold: 128,
  }).data,
  [0b10101010, 0b01010101],
)

assert.deepEqual(
  convertImageDataToModulo(checker, {
    width: 8,
    height: 2,
    colorFormat: 'MONO1',
    monoPolarity: 'yang',
    bitOrder: 'msb',
    scanLayout: 'row',
    threshold: 128,
  }).data,
  [0b01010101, 0b10101010],
)

const wisdom = getPreset('wisdom-ili9341-bgr565')
assert.equal(wisdom.colorFormat, 'BGR565')
assert.equal(wisdom.width, 240)
assert.equal(wisdom.height, 240)
assert.equal(wisdom.scanLayout, 'column')
assert.equal(wisdom.byteOrder, 'big')

const outputResult = {
  name: 'golden_image',
  width: 1,
  height: 4,
  colorFormat: 'RGB565',
  data: [0xF8, 0x00, 0x07, 0xE0, 0x00, 0x1F, 0xFF, 0xFF],
}

assert.equal(formatHexText(outputResult.data), '0xF8, 0x00, 0x07, 0xE0, 0x00, 0x1F, 0xFF, 0xFF')
assert.deepEqual(Array.from(formatRawBinary(outputResult.data)), outputResult.data)

const cArray = formatCArray(outputResult)
assert.match(cArray, /#define GOLDEN_IMAGE_WIDTH 1/)
assert.match(cArray, /#define GOLDEN_IMAGE_HEIGHT 4/)
assert.match(cArray, /const uint8_t golden_image\[\]/)

const cHeader = formatCHeader(outputResult)
assert.match(cHeader, /#ifndef GOLDEN_IMAGE_H/)
assert.match(cHeader, /extern const uint8_t golden_image\[\];/)

const lvgl = formatLvglDescriptor(outputResult, { name: 'golden_lvgl', colorFormat: 'RGB565' })
assert.match(lvgl, /LV_COLOR_FORMAT_RGB565/)
assert.match(lvgl, /\.data_size = sizeof\(golden_lvgl_data\)/)

const arduino = formatArduinoProgmem(outputResult, { name: 'golden_arduino' })
assert.match(arduino, /const uint16_t golden_arduino\[\] PROGMEM/)
assert.match(arduino, /0xF800, 0x07E0, 0x001F, 0xFFFF/)
