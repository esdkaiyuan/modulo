import { iteratePixels, transformPixel } from './scanOrder.js'

const getGray = (pixels, index) => (
  pixels[index] * 0.299 +
  pixels[index + 1] * 0.587 +
  pixels[index + 2] * 0.114
)

const getBitMask = (bitIndex, bitOrder = 'msb') => {
  const bit = bitIndex % 8
  return 1 << (bitOrder === 'lsb' ? bit : 7 - bit)
}

export const isMonoPixelLit = (pixels, offset, config = {}) => {
  const threshold = Number(config.threshold ?? 128)
  const alpha = pixels[offset + 3] ?? 255
  if (alpha === 0 && config.transparentMode === 'transparentOff') return false
  return getGray(pixels, offset) < threshold
}

export const packMonoPixels = (imageData, config = {}) => {
  const width = config.width || imageData.width
  const height = config.height || imageData.height
  const pixels = imageData.data
  const data = []
  const bitOrder = config.bitOrder || config.byteOrder || 'msb'

  const setBit = (byte, bit, lit) => {
    const writesOne = (config.monoPolarity || config.encodingMode || 'yin') === 'yang'
      ? !lit
      : lit
    return writesOne ? byte | getBitMask(bit, bitOrder) : byte
  }

  if ((config.scanLayout || config.scanMode || 'row') === 'column') {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y += 8) {
        let byte = 0
        for (let bit = 0; bit < 8 && y + bit < height; bit++) {
          const point = transformPixel(x, y + bit, width, height, config)
          const offset = (point.y * imageData.width + point.x) * 4
          byte = setBit(byte, bit, isMonoPixelLit(pixels, offset, config))
        }
        data.push(byte)
      }
    }
    return data
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 8) {
      let byte = 0
      for (let bit = 0; bit < 8 && x + bit < width; bit++) {
        const point = transformPixel(x + bit, y, width, height, config)
        const offset = (point.y * imageData.width + point.x) * 4
        byte = setBit(byte, bit, isMonoPixelLit(pixels, offset, config))
      }
      data.push(byte)
    }
  }

  return data
}

export const renderMonoToRgba = (data, config = {}) => {
  const width = config.width
  const height = config.height
  const rgba = new Uint8ClampedArray(width * height * 4)
  rgba.fill(255)
  let byteIndex = 0
  const bitOrder = config.bitOrder || config.byteOrder || 'msb'

  const writePixel = (x, y, bitSet) => {
    const point = transformPixel(x, y, width, height, config)
    const lit = (config.monoPolarity || config.encodingMode || 'yin') === 'yang'
      ? !bitSet
      : bitSet
    const offset = (point.y * width + point.x) * 4
    const color = lit ? [17, 24, 39] : [255, 255, 255]
    rgba[offset] = color[0]
    rgba[offset + 1] = color[1]
    rgba[offset + 2] = color[2]
    rgba[offset + 3] = 255
  }

  if ((config.scanLayout || config.scanMode || 'row') === 'column') {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y += 8) {
        const byte = data[byteIndex++] || 0
        for (let bit = 0; bit < 8 && y + bit < height; bit++) {
          writePixel(x, y + bit, (byte & getBitMask(bit, bitOrder)) !== 0)
        }
      }
    }
    return { data: rgba, width, height }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 8) {
      const byte = data[byteIndex++] || 0
      for (let bit = 0; bit < 8 && x + bit < width; bit++) {
        writePixel(x + bit, y, (byte & getBitMask(bit, bitOrder)) !== 0)
      }
    }
  }

  return { data: rgba, width, height }
}

/*
 * Keep the import used so bundlers and tests catch accidental API removal from
 * scanOrder; color packing consumes the streaming iterator directly.
 */
void iteratePixels
