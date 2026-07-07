import { computed, ref } from 'vue'
import { getPreset, listPresets } from '../core/presets.js'

const toLegacyEncoding = (monoPolarity = 'yin') => monoPolarity === 'yang' ? '阳码' : '阴码'
const toLegacyBitOrder = (bitOrder = 'msb', byteOrder = 'big') => {
  if (bitOrder === 'lsb' || byteOrder === 'little') return 'lsb'
  return 'msb'
}

export const useModuloConfig = () => {
  const presetOptions = listPresets()
  const initialPreset = getPreset('pctolcd2002-16x16-mono')

  const presetId = ref(initialPreset.id)
  const width = ref(initialPreset.width)
  const height = ref(initialPreset.height)
  const scanMode = ref(initialPreset.scanLayout)
  const encodingMode = ref(toLegacyEncoding(initialPreset.monoPolarity))
  const byteOrder = ref(toLegacyBitOrder(initialPreset.bitOrder, initialPreset.byteOrder))
  const threshold = ref(initialPreset.threshold)
  const imageMode = ref(initialPreset.colorFormat === 'MONO1' ? 'mono' : 'color')
  const colorDepth = ref(initialPreset.colorFormat === 'RGB565' || initialPreset.colorFormat === 'BGR565' ? 16 : 8)
  const colorFormat = ref(initialPreset.colorFormat)
  const outputFormat = ref(initialPreset.outputFormat)
  const rotation = ref(initialPreset.rotation)
  const flipX = ref(initialPreset.flipX)
  const flipY = ref(initialPreset.flipY)
  const resizeMode = ref(initialPreset.resizeMode)
  const backgroundColor = ref(initialPreset.backgroundColor)
  const transparentMode = ref(initialPreset.transparentMode)

  const applyPresetById = (id) => {
    const preset = getPreset(id)
    presetId.value = preset.id
    width.value = preset.width
    height.value = preset.height
    scanMode.value = preset.scanLayout === 'page' ? 'column' : preset.scanLayout
    encodingMode.value = toLegacyEncoding(preset.monoPolarity)
    byteOrder.value = toLegacyBitOrder(preset.bitOrder, preset.byteOrder)
    threshold.value = preset.threshold
    imageMode.value = preset.colorFormat === 'MONO1' ? 'mono' : 'color'
    colorFormat.value = preset.colorFormat
    colorDepth.value = preset.colorFormat === 'RGB565' || preset.colorFormat === 'BGR565'
      ? 16
      : preset.colorFormat === 'RGB888' || preset.colorFormat === 'BGR888'
        ? 24
        : preset.colorFormat === 'ARGB8888' || preset.colorFormat === 'RGBA8888'
          ? 32
          : 8
    outputFormat.value = preset.outputFormat
    rotation.value = preset.rotation
    flipX.value = preset.flipX
    flipY.value = preset.flipY
    resizeMode.value = preset.resizeMode
    backgroundColor.value = preset.backgroundColor
    transparentMode.value = preset.transparentMode
  }

  const moduloConfig = computed(() => ({
    presetId: presetId.value,
    width: width.value,
    height: height.value,
    imageMode: imageMode.value,
    colorDepth: Number(colorDepth.value),
    colorFormat: colorFormat.value,
    scanMode: scanMode.value,
    scanLayout: scanMode.value,
    encodingMode: encodingMode.value,
    monoPolarity: encodingMode.value === '阳码' ? 'yang' : 'yin',
    byteOrder: byteOrder.value,
    bitOrder: byteOrder.value,
    threshold: threshold.value,
    outputFormat: outputFormat.value,
    rotation: Number(rotation.value),
    flipX: flipX.value,
    flipY: flipY.value,
    resizeMode: resizeMode.value,
    backgroundColor: backgroundColor.value,
    transparentMode: transparentMode.value,
  }))

  const getModuloOptions = () => ({ ...moduloConfig.value })

  return {
    presetOptions,
    presetId,
    width,
    height,
    scanMode,
    encodingMode,
    byteOrder,
    threshold,
    imageMode,
    colorDepth,
    colorFormat,
    outputFormat,
    rotation,
    flipX,
    flipY,
    resizeMode,
    backgroundColor,
    transparentMode,
    moduloConfig,
    applyPresetById,
    getModuloOptions,
  }
}

