import {
  getBytesPerFrame,
  packImageDataToModulo,
} from './modulo.js'
import {
  convertImageDataToModulo,
  getBytesPerFrameForConfig,
  renderModuloToRgba as renderCoreModuloToRgba,
} from '../core/moduloEngine.js'

const MONO_ON = [17, 24, 39]
const MONO_OFF = [255, 255, 255]

const getGray = (pixels, index) => {
  return (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3
}

const shouldPixelRenderOn = (byte, bit, options = {}) => {
  const {
    encodingMode = '阴码',
    byteOrder = 'msb',
  } = options
  const bitValue = (byte >> (byteOrder === 'msb' ? (7 - bit) : bit)) & 1
  return encodingMode === '阴码' ? bitValue === 1 : bitValue === 0
}

const writeRgba = (target, pixelIndex, rgb) => {
  const offset = pixelIndex * 4
  target[offset] = rgb[0]
  target[offset + 1] = rgb[1]
  target[offset + 2] = rgb[2]
  target[offset + 3] = 255
}

const quantize4Bit = (r, g, b) => {
  const gray = (r + g + b) / 3
  if (gray >= 248) return 0x0F
  const r1 = r >= 128 ? 1 : 0
  const g1 = g >= 128 ? 1 : 0
  const b1 = b >= 128 ? 1 : 0
  const intensity = gray >= 128 ? 1 : 0
  return (intensity << 3) | (r1 << 2) | (g1 << 1) | b1
}

const expand4Bit = (value) => {
  const index = value & 0x0F
  if (index === 0x0F) return [255, 255, 255]
  const intensity = index & 0x08
  const high = intensity ? 255 : 170
  const low = 0
  return [
    index & 0x04 ? high : low,
    index & 0x02 ? high : low,
    index & 0x01 ? high : low,
  ]
}

const rgbTo332 = (r, g, b) => {
  return ((r & 0xE0) | ((g & 0xE0) >> 3) | (b >> 6)) & 0xFF
}

const rgbFrom332 = (value) => {
  const r = (value >> 5) & 0x07
  const g = (value >> 2) & 0x07
  const b = value & 0x03
  return [
    Math.round((r / 7) * 255),
    Math.round((g / 7) * 255),
    Math.round((b / 3) * 255),
  ]
}

const rgbTo565 = (r, g, b) => {
  return (((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)) & 0xFFFF
}

const rgbFrom565 = (highByte, lowByte) => {
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

const packColor1 = (imageData, width, height, options = {}) => {
  return packImageDataToModulo(imageData, width, height, options)
}

const packColor4 = (imageData, width, height) => {
  const pixels = imageData.data
  const data = []
  const pixelCount = width * height

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 2) {
    const firstIndex = pixelIndex * 4
    const first = quantize4Bit(pixels[firstIndex], pixels[firstIndex + 1], pixels[firstIndex + 2])
    let second = 0
    if (pixelIndex + 1 < pixelCount) {
      const secondIndex = (pixelIndex + 1) * 4
      second = quantize4Bit(pixels[secondIndex], pixels[secondIndex + 1], pixels[secondIndex + 2])
    }
    data.push((first << 4) | second)
  }

  return data
}

const packColor8 = (imageData, width, height) => {
  const pixels = imageData.data
  const data = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      data.push(rgbTo332(pixels[index], pixels[index + 1], pixels[index + 2]))
    }
  }

  return data
}

const packColor16 = (imageData, width, height) => {
  const pixels = imageData.data
  const data = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const color = rgbTo565(pixels[index], pixels[index + 1], pixels[index + 2])
      data.push((color >> 8) & 0xFF, color & 0xFF)
    }
  }

  return data
}

export const getImageModuloBytesPerFrame = (width, height, options = {}) => {
  if (options.colorFormat) {
    return getBytesPerFrameForConfig({ ...options, width, height })
  }

  const {
    imageMode = 'mono',
    colorDepth = 8,
    scanMode = 'row',
  } = options

  if (imageMode !== 'color') {
    return getBytesPerFrame(width, height, scanMode)
  }

  const depth = Number(colorDepth)
  if (depth === 1) return getBytesPerFrame(width, height, scanMode)
  if (depth === 4) return Math.ceil(width * height / 2)
  if (depth === 16) return width * height * 2
  return width * height
}

export const packImageDataByMode = (imageData, width, height, options = {}) => {
  if (options.colorFormat) {
    return convertImageDataToModulo({ ...imageData, width, height }, { ...options, width, height }).data
  }

  const {
    imageMode = 'mono',
    colorDepth = 8,
  } = options

  if (imageMode !== 'color') {
    return packImageDataToModulo(imageData, width, height, options)
  }

  const depth = Number(colorDepth)
  if (depth === 1) return packColor1(imageData, width, height, options)
  if (depth === 4) return packColor4(imageData, width, height)
  if (depth === 16) return packColor16(imageData, width, height)
  return packColor8(imageData, width, height)
}

const renderMonoToRgba = (data, width, height, options = {}) => {
  const rgba = new Uint8ClampedArray(width * height * 4)
  rgba.fill(255)

  if (options.scanMode === 'column') {
    const byteRows = Math.ceil(height / 8)
    data.forEach((byte, byteIndex) => {
      const x = Math.floor(byteIndex / byteRows)
      const baseY = (byteIndex % byteRows) * 8
      for (let bit = 0; bit < 8; bit++) {
        const y = baseY + bit
        if (x >= width || y >= height) continue
        writeRgba(rgba, y * width + x, shouldPixelRenderOn(byte, bit, options) ? MONO_ON : MONO_OFF)
      }
    })
    return { data: rgba, width, height }
  }

  const byteColumns = Math.ceil(width / 8)
  data.forEach((byte, byteIndex) => {
    const baseX = (byteIndex % byteColumns) * 8
    const y = Math.floor(byteIndex / byteColumns)
    for (let bit = 0; bit < 8; bit++) {
      const x = baseX + bit
      if (x >= width || y >= height) continue
      writeRgba(rgba, y * width + x, shouldPixelRenderOn(byte, bit, options) ? MONO_ON : MONO_OFF)
    }
  })

  return { data: rgba, width, height }
}

const renderColor4ToRgba = (data, width, height) => {
  const rgba = new Uint8ClampedArray(width * height * 4)
  let pixelIndex = 0

  for (const byte of data) {
    if (pixelIndex < width * height) {
      writeRgba(rgba, pixelIndex, expand4Bit(byte >> 4))
      pixelIndex++
    }
    if (pixelIndex < width * height) {
      writeRgba(rgba, pixelIndex, expand4Bit(byte))
      pixelIndex++
    }
  }

  return { data: rgba, width, height }
}

const renderColor8ToRgba = (data, width, height) => {
  const rgba = new Uint8ClampedArray(width * height * 4)
  const pixelCount = width * height

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
    writeRgba(rgba, pixelIndex, rgbFrom332(data[pixelIndex] || 0))
  }

  return { data: rgba, width, height }
}

const renderColor16ToRgba = (data, width, height) => {
  const rgba = new Uint8ClampedArray(width * height * 4)
  const pixelCount = width * height

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
    const offset = pixelIndex * 2
    writeRgba(rgba, pixelIndex, rgbFrom565(data[offset] || 0, data[offset + 1] || 0))
  }

  return { data: rgba, width, height }
}

export const renderModuloToRgba = (data, width, height, options = {}) => {
  if (options.colorFormat) {
    return renderCoreModuloToRgba(data, { ...options, width, height })
  }

  const {
    imageMode = 'mono',
    colorDepth = 8,
  } = options

  if (imageMode !== 'color') {
    return renderMonoToRgba(data, width, height, options)
  }

  const depth = Number(colorDepth)
  if (depth === 1) return renderMonoToRgba(data, width, height, options)
  if (depth === 4) return renderColor4ToRgba(data, width, height)
  if (depth === 16) return renderColor16ToRgba(data, width, height)
  return renderColor8ToRgba(data, width, height)
}

export const imageModeLabel = (imageMode, colorDepth) => {
  if (imageMode && !['mono', 'color'].includes(imageMode)) return imageMode
  if (imageMode !== 'color') return '单色'
  return `${Number(colorDepth) || 8}位彩色`
}
