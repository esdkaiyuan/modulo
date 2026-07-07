import { packColorPixels, decodePackedToRgba, getColorBytesPerPixel } from './colorPacking.js'
import { packMonoPixels, renderMonoToRgba } from './monoPacking.js'

export const normalizeModuloConfig = (config = {}) => ({
  width: Number(config.width),
  height: Number(config.height),
  colorFormat: (config.colorFormat || (config.imageMode === 'mono' ? 'MONO1' : 'RGB332')).toUpperCase(),
  monoPolarity: config.monoPolarity || (config.encodingMode === '阳码' ? 'yang' : 'yin'),
  bitOrder: config.bitOrder || config.byteOrder || 'msb',
  byteOrder: config.byteOrder === 'lsb' ? 'little' : (config.byteOrder || 'big'),
  scanLayout: config.scanLayout || config.scanMode || 'row',
  primaryDirection: config.primaryDirection || 'forward',
  secondaryDirection: config.secondaryDirection || 'forward',
  origin: config.origin || 'top-left',
  rotation: Number(config.rotation || 0),
  flipX: Boolean(config.flipX),
  flipY: Boolean(config.flipY),
  threshold: Number(config.threshold ?? 128),
  transparentMode: config.transparentMode || 'blendBackground',
})

export const getBytesPerFrameForConfig = (config = {}) => {
  const normalized = normalizeModuloConfig(config)
  const pixelCount = normalized.width * normalized.height
  if (normalized.colorFormat === 'MONO1') return Math.ceil(pixelCount / 8)
  return pixelCount * getColorBytesPerPixel(normalized.colorFormat)
}

export const convertImageDataToModulo = (imageData, config = {}) => {
  const normalized = normalizeModuloConfig({
    width: imageData.width,
    height: imageData.height,
    ...config,
  })
  const data = normalized.colorFormat === 'MONO1'
    ? packMonoPixels(imageData, normalized)
    : packColorPixels(imageData, normalized)

  return {
    data,
    width: normalized.width,
    height: normalized.height,
    colorFormat: normalized.colorFormat,
    bytesPerFrame: data.length,
    config: normalized,
  }
}

export const renderModuloToRgba = (data, config = {}) => {
  const normalized = normalizeModuloConfig(config)
  if (normalized.colorFormat === 'MONO1') {
    return renderMonoToRgba(data, normalized)
  }
  return decodePackedToRgba(data, normalized)
}

