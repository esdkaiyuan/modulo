import assert from 'node:assert/strict'
import { getPreset, listPresets } from '../src/core/presets.js'
import {
  formatArduinoProgmem,
  formatBinaryText,
  formatCArray,
  formatCHeader,
  formatHexText,
  formatLvglDescriptor,
  formatRawBinary,
} from '../src/formatters/index.js'

const presetIds = listPresets().map(preset => preset.id)
assert.ok(presetIds.includes('wisdom-ili9341-bgr565'))
assert.ok(presetIds.includes('wisdom-ili9341-rgb565'))
assert.ok(presetIds.includes('pctolcd2002-16x16-mono'))
assert.ok(presetIds.includes('pctolcd2002-32x32-mono'))
assert.ok(presetIds.includes('lvgl-rgb565'))
assert.ok(presetIds.includes('lvgl-rgb888'))
assert.ok(presetIds.includes('lvgl-argb8888'))
assert.ok(presetIds.includes('arduino-tft-rgb565'))
assert.ok(presetIds.includes('oled-128x64-row'))
assert.ok(presetIds.includes('oled-128x64-page'))

assert.deepEqual(
  {
    width: getPreset('wisdom-ili9341-bgr565').width,
    height: getPreset('wisdom-ili9341-bgr565').height,
    colorFormat: getPreset('wisdom-ili9341-bgr565').colorFormat,
    scanLayout: getPreset('wisdom-ili9341-bgr565').scanLayout,
    byteOrder: getPreset('wisdom-ili9341-bgr565').byteOrder,
  },
  {
    width: 240,
    height: 240,
    colorFormat: 'BGR565',
    scanLayout: 'column',
    byteOrder: 'big',
  },
)

assert.equal(getPreset('pctolcd2002-16x16-mono').colorFormat, 'MONO1')
assert.equal(getPreset('pctolcd2002-16x16-mono').monoPolarity, 'yin')
assert.equal(getPreset('oled-128x64-page').scanLayout, 'page')

const result = {
  name: 'demo_bitmap',
  width: 2,
  height: 2,
  colorFormat: 'RGB565',
  bytesPerFrame: 8,
  data: [0xF8, 0x00, 0x07, 0xE0],
}

assert.equal(formatHexText(result.data), '0xF8, 0x00, 0x07, 0xE0')
assert.equal(formatBinaryText([0x80, 0x01]), '10000000\n00000001')
assert.deepEqual(Array.from(formatRawBinary(result.data)), result.data)

const cArray = formatCArray(result)
assert.match(cArray, /const uint8_t demo_bitmap\[\]/)
assert.match(cArray, /0xF8, 0x00, 0x07, 0xE0/)

const cHeader = formatCHeader(result)
assert.match(cHeader, /#ifndef DEMO_BITMAP_H/)
assert.match(cHeader, /extern const uint8_t demo_bitmap\[\];/)
assert.match(cHeader, /#define DEMO_BITMAP_WIDTH 2/)

const lvgl = formatLvglDescriptor(result, { name: 'demo_img', colorFormat: 'RGB565' })
assert.match(lvgl, /LV_COLOR_FORMAT_RGB565/)
assert.match(lvgl, /\.header\.w = 2/)
assert.match(lvgl, /const lv_image_dsc_t demo_img/)

const arduino = formatArduinoProgmem(result, { name: 'demo_img' })
assert.match(arduino, /PROGMEM/)
assert.match(arduino, /const uint16_t demo_img\[\]/)
assert.match(arduino, /0xF800/)
assert.match(arduino, /0x07E0/)

assert.throws(() => getPreset('missing-preset'), /Unknown modulo preset/)
