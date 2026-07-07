export const normalizeScanConfig = (config = {}) => ({
  scanLayout: config.scanLayout || config.scanMode || 'row',
  primaryDirection: config.primaryDirection || 'forward',
  secondaryDirection: config.secondaryDirection || 'forward',
  origin: config.origin || 'top-left',
  rotation: Number(config.rotation || 0),
  flipX: Boolean(config.flipX),
  flipY: Boolean(config.flipY),
})

const rotatePoint = (x, y, width, height, rotation) => {
  const normalized = ((rotation % 360) + 360) % 360
  if (normalized === 90) return { x: y, y: width - 1 - x }
  if (normalized === 180) return { x: width - 1 - x, y: height - 1 - y }
  if (normalized === 270) return { x: height - 1 - y, y: x }
  return { x, y }
}

export const transformPixel = (x, y, width, height, config = {}) => {
  const options = normalizeScanConfig(config)
  let tx = x
  let ty = y
  if (options.origin === 'bottom-left') ty = height - 1 - ty
  if (options.flipX) tx = width - 1 - tx
  if (options.flipY) ty = height - 1 - ty
  return rotatePoint(tx, ty, width, height, options.rotation)
}

export function* iteratePixels(width, height, config = {}) {
  const options = normalizeScanConfig(config)
  const primaryCount = options.scanLayout === 'column' ? width : height
  const secondaryCount = options.scanLayout === 'column' ? height : width
  const primaryIndexes = Array.from({ length: primaryCount }, (_, index) => index)
  const secondaryIndexes = Array.from({ length: secondaryCount }, (_, index) => index)

  if (options.primaryDirection === 'reverse') primaryIndexes.reverse()
  if (options.secondaryDirection === 'reverse') secondaryIndexes.reverse()

  for (const primary of primaryIndexes) {
    for (const secondary of secondaryIndexes) {
      const x = options.scanLayout === 'column' ? primary : secondary
      const y = options.scanLayout === 'column' ? secondary : primary
      const rotated = transformPixel(x, y, width, height, options)
      if (
        rotated.x >= 0 &&
        rotated.x < width &&
        rotated.y >= 0 &&
        rotated.y < height
      ) {
        yield rotated
      }
    }
  }
}
