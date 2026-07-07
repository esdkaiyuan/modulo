import { iteratePixels } from './scanOrder.js'

const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value || 0)))

const writeWord = (data, value, byteOrder = 'big') => {
  const high = (value >> 8) & 0xFF
  const low = value & 0xFF
  if (byteOrder === 'little') data.push(low, high)
  else data.push(high, low)
}

export const rgbTo332 = (r, g, b) => {
  return ((r & 0xE0) | ((g & 0xE0) >> 3) | (b >> 6)) & 0xFF
}

export const rgbFrom332 = (value) => {
  const r = (value >> 5) & 0x07
  const g = (value >> 2) & 0x07
  const b = value & 0x03
  return [
    (r << 5) | (r << 2) | (r >> 1),
    (g << 5) | (g << 2) | (g >> 1),
    (b << 6) | (b << 4) | (b << 2) | b,
  ]
}

export const rgbTo565 = (r, g, b) => {
  return (((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)) & 0xFFFF
}

export const bgrTo565 = (r, g, b) => {
  return (((b & 0xF8) << 8) | ((g & 0xFC) << 3) | (r >> 3)) & 0xFFFF
}

export const rgbFrom565 = (highByte, lowByte) => {
  const value = ((highByte << 8) | lowByte) & 0xFFFF
  const r = (value >> 11) & 0x1F
  const g = (value >> 5) & 0x3F
  const b = value & 0x1F
  return [
    Math.round((r / 31) * 255),
    Math.round((g / 63) * 255),
    Math.round((b / 31) * 255),
  ]
}

export const rgbFromBgr565 = (highByte, lowByte) => {
  const [b, g, r] = rgbFrom565(highByte, lowByte)
  return [r, g, b]
}

const getWordBytes = (data, offset, byteOrder = 'big') => {
  if (byteOrder === 'little') return [data[offset + 1] || 0, data[offset] || 0]
  return [data[offset] || 0, data[offset + 1] || 0]
}

const writeRgba = (rgba, pixelIndex, rgb, alpha = 255) => {
  const offset = pixelIndex * 4
  rgba[offset] = rgb[0]
  rgba[offset + 1] = rgb[1]
  rgba[offset + 2] = rgb[2]
  rgba[offset + 3] = alpha
}

export const getColorBytesPerPixel = (colorFormat = 'RGB332') => {
  const format = colorFormat.toUpperCase()
  if (format === 'RGB565' || format === 'BGR565' || format === 'GRAY16') return 2
  if (format === 'RGB888' || format === 'BGR888') return 3
  if (format === 'ARGB8888' || format === 'RGBA8888') return 4
  return 1
}

export const packColorPixels = (imageData, config = {}) => {
  const width = config.width || imageData.width
  const height = config.height || imageData.height
  const format = (config.colorFormat || 'RGB332').toUpperCase()
  const data = []

  for (const { x, y } of iteratePixels(width, height, config)) {
    const offset = (y * imageData.width + x) * 4
    const r = clampByte(imageData.data[offset])
    const g = clampByte(imageData.data[offset + 1])
    const b = clampByte(imageData.data[offset + 2])
    const a = clampByte(imageData.data[offset + 3] ?? 255)
    const gray = clampByte(r * 0.299 + g * 0.587 + b * 0.114)

    if (format === 'GRAY2') data.push(gray >> 6)
    else if (format === 'GRAY4') data.push(gray >> 4)
    else if (format === 'GRAY8') data.push(gray)
    else if (format === 'RGB565') writeWord(data, rgbTo565(r, g, b), config.byteOrder)
    else if (format === 'BGR565') writeWord(data, bgrTo565(r, g, b), config.byteOrder)
    else if (format === 'RGB888') data.push(r, g, b)
    else if (format === 'BGR888') data.push(b, g, r)
    else if (format === 'ARGB8888') data.push(a, r, g, b)
    else if (format === 'RGBA8888') data.push(r, g, b, a)
    else data.push(rgbTo332(r, g, b))
  }

  return data
}

export const decodePackedToRgba = (data, config = {}) => {
  const width = config.width
  const height = config.height
  const format = (config.colorFormat || 'RGB332').toUpperCase()
  const rgba = new Uint8ClampedArray(width * height * 4)
  let inputOffset = 0
  let pixelIndex = 0

  for (const { x, y } of iteratePixels(width, height, config)) {
    const outputIndex = y * width + x
    if (format === 'RGB565' || format === 'BGR565') {
      const [high, low] = getWordBytes(data, inputOffset, config.byteOrder)
      const rgb = format === 'BGR565' ? rgbFromBgr565(high, low) : rgbFrom565(high, low)
      writeRgba(rgba, outputIndex, rgb)
      inputOffset += 2
    } else if (format === 'RGB888' || format === 'BGR888') {
      const first = data[inputOffset] || 0
      const second = data[inputOffset + 1] || 0
      const third = data[inputOffset + 2] || 0
      writeRgba(rgba, outputIndex, format === 'BGR888' ? [third, second, first] : [first, second, third])
      inputOffset += 3
    } else if (format === 'ARGB8888') {
      writeRgba(rgba, outputIndex, [data[inputOffset + 1] || 0, data[inputOffset + 2] || 0, data[inputOffset + 3] || 0], data[inputOffset] || 0)
      inputOffset += 4
    } else if (format === 'RGBA8888') {
      writeRgba(rgba, outputIndex, [data[inputOffset] || 0, data[inputOffset + 1] || 0, data[inputOffset + 2] || 0], data[inputOffset + 3] || 0)
      inputOffset += 4
    } else if (format === 'GRAY2' || format === 'GRAY4' || format === 'GRAY8') {
      const value = data[inputOffset] || 0
      const gray = format === 'GRAY2' ? Math.round((value / 3) * 255) : format === 'GRAY4' ? Math.round((value / 15) * 255) : value
      writeRgba(rgba, outputIndex, [gray, gray, gray])
      inputOffset += 1
    } else {
      writeRgba(rgba, outputIndex, rgbFrom332(data[inputOffset] || 0))
      inputOffset += 1
    }
    pixelIndex++
  }

  return { data: rgba, width, height }
}

