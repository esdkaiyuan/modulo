const animatedImageExtensions = /\.(gif|png|apng|webp)$/i
const stillImageExtensions = /\.(bmp|ico|svg|avif|jpg|jpeg)$/i
const videoExtensions = /\.(mp4|webm|mov|m4v|ogv|ogg)$/i

const extensionTypeMap = [
  [/\.gif$/i, 'image/gif'],
  [/\.(png|apng)$/i, 'image/png'],
  [/\.webp$/i, 'image/webp'],
  [/\.bmp$/i, 'image/bmp'],
  [/\.ico$/i, 'image/x-icon'],
  [/\.svg$/i, 'image/svg+xml'],
  [/\.avif$/i, 'image/avif'],
  [/\.(jpg|jpeg)$/i, 'image/jpeg'],
  [/\.webm$/i, 'video/webm'],
  [/\.(mp4|mov|m4v)$/i, 'video/mp4'],
  [/\.(ogv|ogg)$/i, 'video/ogg'],
]

const startsWithBytes = (bytes, signature) => {
  if (!bytes || bytes.length < signature.length) return false
  return signature.every((value, index) => bytes[index] === value)
}

const bytesToAscii = (bytes, start, end) => {
  return Array.from(bytes.slice(start, end)).map(byte => String.fromCharCode(byte)).join('')
}

export const detectMediaTypeFromHeader = (bytes, fallback = '') => {
  if (!bytes || bytes.length === 0) return fallback

  if (
    startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return 'image/gif'
  }

  if (startsWithBytes(bytes, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
    return 'image/png'
  }

  if (startsWithBytes(bytes, [0x42, 0x4D])) {
    return 'image/bmp'
  }

  if (
    startsWithBytes(bytes, [0x00, 0x00, 0x01, 0x00]) ||
    startsWithBytes(bytes, [0x00, 0x00, 0x02, 0x00])
  ) {
    return 'image/x-icon'
  }

  if (bytes.length >= 12 && bytesToAscii(bytes, 0, 4) === 'RIFF' && bytesToAscii(bytes, 8, 12) === 'WEBP') {
    return 'image/webp'
  }

  if (bytes.length >= 12 && bytesToAscii(bytes, 4, 8) === 'ftyp') {
    const brand = bytesToAscii(bytes, 8, 12).toLowerCase()
    return brand.includes('avif') ? 'image/avif' : 'video/mp4'
  }

  if (startsWithBytes(bytes, [0x1A, 0x45, 0xDF, 0xA3])) {
    return 'video/webm'
  }

  return fallback
}

export const inferMediaType = (file) => {
  if (file?.type) return file.type
  const name = file?.name || ''
  const match = extensionTypeMap.find(([pattern]) => pattern.test(name))
  return match ? match[1] : ''
}

export const getMediaKind = (file) => {
  const name = file?.name || ''
  const type = inferMediaType(file)

  if (
    type === 'image/gif' ||
    type === 'image/png' ||
    type === 'image/apng' ||
    type === 'image/webp' ||
    animatedImageExtensions.test(name)
  ) {
    return 'animatedImage'
  }

  if (
    type === 'image/bmp' ||
    type === 'image/x-icon' ||
    type === 'image/vnd.microsoft.icon' ||
    type === 'image/svg+xml' ||
    type === 'image/avif' ||
    type === 'image/jpeg' ||
    stillImageExtensions.test(name)
  ) {
    return 'image'
  }

  if (type.startsWith('video/') || videoExtensions.test(name)) {
    return 'video'
  }

  return 'unsupported'
}

export const isSupportedForWorkflow = (file, workflow) => {
  return getMediaKind(file) === workflow
}

export const getWorkflowLabel = (workflow) => {
  if (workflow === 'video') return '视频取模'
  if (workflow === 'image') return '图片取模'
  return '动图取模'
}

export const getStillImageAccept = () => {
  return 'image/png,image/jpeg,image/bmp,image/x-icon,image/svg+xml,image/avif,image/webp,.png,.jpg,.jpeg,.bmp,.ico,.svg,.avif,.webp'
}

export const getWorkflowAccept = (workflow) => {
  if (workflow === 'video') {
    return 'video/mp4,video/webm,video/quicktime,video/ogg,video/*,.mp4,.webm,.mov,.m4v,.ogv,.ogg'
  }
  if (workflow === 'image') return getStillImageAccept()
  return 'image/gif,image/png,image/apng,image/webp,.gif,.png,.apng,.webp'
}

export const getWorkflowHint = (workflow) => {
  if (workflow === 'video') return '支持 MP4、WebM、MOV、M4V、OGV 等视频格式'
  if (workflow === 'image') return '支持 PNG、JPG、BMP、ICO、SVG、AVIF、WebP 等图片格式'
  return '支持 GIF、APNG/PNG、WebP 等动图格式'
}

