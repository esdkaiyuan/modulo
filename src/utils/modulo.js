export const getBytesPerFrame = (width, height, scanMode) => {
  return scanMode === 'row'
    ? Math.ceil(width / 8) * height
    : Math.ceil(height / 8) * width
}

export const formatHexData = (data) => {
  return Array.from(data).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')
}

export const formatBinData = (data) => {
  return Array.from(data).map(b => b.toString(2).padStart(8, '0')).join('\n')
}

export const packImageDataToModulo = (imageData, width, height, options = {}) => {
  const {
    scanMode = 'row',
    encodingMode = '阴码',
    byteOrder = 'msb',
    threshold = 128,
  } = options
  const pixels = imageData.data
  const data = []

  const shouldSetBit = (gray) => {
    const isOn = gray < threshold
    return encodingMode === '阴码' ? isOn : !isOn
  }

  const bitMask = (bit) => 1 << (byteOrder === 'msb' ? (7 - bit) : bit)

  if (scanMode === 'row') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x += 8) {
        let byte = 0
        for (let bit = 0; bit < 8 && (x + bit) < width; bit++) {
          const idx = (y * width + x + bit) * 4
          const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
          if (shouldSetBit(gray)) byte |= bitMask(bit)
        }
        data.push(byte)
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y += 8) {
        let byte = 0
        for (let bit = 0; bit < 8 && (y + bit) < height; bit++) {
          const idx = ((y + bit) * width + x) * 4
          const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
          if (shouldSetBit(gray)) byte |= bitMask(bit)
        }
        data.push(byte)
      }
    }
  }

  return data
}
