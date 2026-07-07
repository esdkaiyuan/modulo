const animatedImageExtensions = /\.(gif|png|apng|webp)$/i
const videoExtensions = /\.(mp4|webm|mov|m4v)$/i

const extensionTypeMap = [
  [/\.gif$/i, 'image/gif'],
  [/\.(png|apng)$/i, 'image/png'],
  [/\.webp$/i, 'image/webp'],
  [/\.webm$/i, 'video/webm'],
  [/\.(mp4|mov|m4v)$/i, 'video/mp4'],
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

  if (bytes.length >= 12 && bytesToAscii(bytes, 0, 4) === 'RIFF' && bytesToAscii(bytes, 8, 12) === 'WEBP') {
    return 'image/webp'
  }

  if (bytes.length >= 12 && bytesToAscii(bytes, 4, 8) === 'ftyp') {
    return 'video/mp4'
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

  if (type.startsWith('video/') || videoExtensions.test(name)) {
    return 'video'
  }

  return 'unsupported'
}

export const isSupportedForWorkflow = (file, workflow) => {
  return getMediaKind(file) === workflow
}

export const getWorkflowLabel = (workflow) => {
  return workflow === 'video' ? '视频取模' : '动图取模'
}

export const getWorkflowAccept = (workflow) => {
  return workflow === 'video'
    ? 'video/mp4,video/webm,video/quicktime,video/*,.mp4,.webm,.mov,.m4v'
    : 'image/gif,image/png,image/apng,image/webp,.gif,.png,.apng,.webp'
}

export const getWorkflowHint = (workflow) => {
  return workflow === 'video'
    ? '支持 MP4、WebM、MOV、M4V 等视频格式'
    : '支持 GIF、APNG/PNG、WebP 等动图格式'
}
