import { convertImageDataToModulo } from '../core/moduloEngine.js'

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
  return convertImageDataToModulo({ ...imageData, width, height }, {
    ...options,
    width,
    height,
    colorFormat: 'MONO1',
    scanLayout: options.scanLayout || options.scanMode || 'row',
    monoPolarity: options.monoPolarity || (options.encodingMode === '阳码' ? 'yang' : 'yin'),
    bitOrder: options.bitOrder || options.byteOrder || 'msb',
  }).data
}
