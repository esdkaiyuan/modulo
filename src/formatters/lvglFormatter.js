import { formatHexText } from './binaryFormatter.js'

const lvglFormatMap = {
  RGB565: 'LV_COLOR_FORMAT_RGB565',
  RGB888: 'LV_COLOR_FORMAT_RGB888',
  ARGB8888: 'LV_COLOR_FORMAT_ARGB8888',
  RGBA8888: 'LV_COLOR_FORMAT_ARGB8888',
  MONO1: 'LV_COLOR_FORMAT_I1',
}

export const formatLvglDescriptor = (result, options = {}) => {
  const name = options.name || result.name || 'bitmap_img'
  const colorFormat = options.colorFormat || result.colorFormat || 'RGB565'
  const marker = lvglFormatMap[colorFormat] || `LV_COLOR_FORMAT_${colorFormat}`

  return `#include "lvgl.h"

static const uint8_t ${name}_data[] = {
    ${formatHexText(result.data)}
};

const lv_image_dsc_t ${name} = {
    .header.cf = ${marker},
    .header.w = ${result.width},
    .header.h = ${result.height},
    .data_size = sizeof(${name}_data),
    .data = ${name}_data,
};`
}

