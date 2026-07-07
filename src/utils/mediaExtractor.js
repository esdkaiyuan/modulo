import { parseGIF, decompressFrames } from 'gifuct-js'
import UPNG from 'upng-js'
import { detectMediaTypeFromHeader, inferMediaType } from './mediaTypes.js'

const clampProgress = (value) => Math.max(0, Math.min(1, value || 0))

const isVideoFile = (file) => {
  const name = file?.name || ''
  return file?.type?.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(name)
}

const canvasToPngFrame = (canvas, index, timestampMs) => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('帧图像生成失败'))
        return
      }
      resolve({
        index,
        timestampMs,
        blob,
        previewUrl: URL.createObjectURL(blob),
      })
    }, 'image/png')
  })
}

const imageBitmapToFrame = async (bitmap, index, timestampMs) => {
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0)
  return canvasToPngFrame(canvas, index, timestampMs)
}

const fallbackToStaticImageFrame = async (file, onProgress) => {
  const bitmap = await createImageBitmap(file)
  try {
    const frame = await imageBitmapToFrame(bitmap, 0, 0)
    onProgress(1)
    return [frame]
  } finally {
    bitmap.close?.()
  }
}

const getFrameTimestamp = (index, fps, frameDelay) => {
  if (Number.isFinite(frameDelay) && frameDelay > 0) return Math.round(index * frameDelay)
  return Math.round((index / Math.max(1, fps)) * 1000)
}

const getPatchImageData = (patch, width, height) => {
  if (typeof ImageData !== 'undefined') {
    return new ImageData(patch, width, height)
  }
  return { data: patch, width, height }
}

const getFileBuffer = async (file, providedBuffer) => {
  return providedBuffer || await file.arrayBuffer()
}

const extractGifFrames = async (file, options, providedBuffer) => {
  const {
    maxFrames,
    fps,
    onProgress,
  } = options
  const frameLimit = Math.max(1, Number(maxFrames) || 1)
  const buffer = await getFileBuffer(file, providedBuffer)
  const gif = parseGIF(buffer)
  const decodedFrames = decompressFrames(gif, true)
  const totalFrames = Math.min(decodedFrames.length, frameLimit)
  const canvas = document.createElement('canvas')
  canvas.width = gif.lsd.width || 1
  canvas.height = gif.lsd.height || 1
  const ctx = canvas.getContext('2d')
  const patchCanvas = document.createElement('canvas')
  const patchCtx = patchCanvas.getContext('2d')
  const frames = []
  let previousImageData = null
  let timestampMs = 0

  for (let index = 0; index < totalFrames; index++) {
    const frame = decodedFrames[index]
    const dims = frame.dims
    const disposalType = frame.disposalType
    const patchImageData = getPatchImageData(frame.patch, dims.width, dims.height)
    patchCanvas.width = dims.width
    patchCanvas.height = dims.height

    if (disposalType === 3) {
      previousImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

    patchCtx.putImageData(patchImageData, 0, 0)
    ctx.drawImage(patchCanvas, dims.left, dims.top)
    frames.push(await canvasToPngFrame(canvas, index, timestampMs))
    onProgress(clampProgress(frames.length / totalFrames))
    timestampMs += frame.delay || Math.round(1000 / Math.max(1, fps))

    if (disposalType === 2) {
      ctx.clearRect(dims.left, dims.top, dims.width, dims.height)
    } else if (disposalType === 3 && previousImageData) {
      ctx.putImageData(previousImageData, 0, 0)
      previousImageData = null
    }
  }

  return frames
}

const getApngFrameDelay = (png, index, fps) => {
  const frame = png.frames?.[index]
  if (!frame) return Math.round(1000 / Math.max(1, fps))
  return frame.delay || Math.round(1000 / Math.max(1, fps))
}

const extractApngFrames = async (file, options, providedBuffer) => {
  const {
    maxFrames,
    fps,
    onProgress,
  } = options
  const frameLimit = Math.max(1, Number(maxFrames) || 1)
  const png = UPNG.decode(await getFileBuffer(file, providedBuffer))
  const rgbaFrames = UPNG.toRGBA8(png)
  const totalFrames = Math.min(rgbaFrames.length, frameLimit)
  const canvas = document.createElement('canvas')
  canvas.width = png.width || 1
  canvas.height = png.height || 1
  const ctx = canvas.getContext('2d')
  const frames = []
  let timestampMs = 0

  for (let index = 0; index < totalFrames; index++) {
    const rgba = new Uint8ClampedArray(rgbaFrames[index])
    const imageData = getPatchImageData(rgba, canvas.width, canvas.height)
    ctx.putImageData(imageData, 0, 0)
    frames.push(await canvasToPngFrame(canvas, index, timestampMs))
    onProgress(clampProgress(frames.length / totalFrames))
    timestampMs += getApngFrameDelay(png, index, fps)
  }

  return frames
}

const extractWithImageDecoder = async (file, options) => {
  const {
    maxFrames,
    fps,
    onProgress,
  } = options
  const frameLimit = Math.max(1, Number(maxFrames) || 1)
  const frames = []
  let decoder

  try {
    decoder = new ImageDecoder({
      data: file.stream(),
      type: file.type || 'image/png',
    })

    await decoder.tracks.ready
    const selectedTrack = decoder.tracks.selectedTrack
    const frameCount = selectedTrack?.frameCount && selectedTrack.frameCount > 0
      ? Math.min(selectedTrack.frameCount, frameLimit)
      : frameLimit

    for (let index = 0; index < frameCount; index++) {
      const { image } = await decoder.decode({ frameIndex: index })
      try {
        frames.push(await imageBitmapToFrame(image, index, getFrameTimestamp(index, fps)))
        onProgress(clampProgress(frames.length / frameCount))
      } finally {
        image.close?.()
      }
    }
  } catch {
    return frames
  } finally {
    decoder?.close?.()
  }

  return frames
}

const extractAnimatedImageFrames = async (file, options) => {
  const {
    onStatus,
    onProgress,
  } = options

  onStatus('decoding')
  const buffer = await file.arrayBuffer()
  const header = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 16))
  const realType = detectMediaTypeFromHeader(header, inferMediaType(file))

  try {
    if (realType === 'image/gif') {
      const frames = await extractGifFrames(file, options, buffer)
      if (frames.length > 1) return frames
    }

    if (realType === 'image/png' || realType === 'image/apng') {
      const frames = await extractApngFrames(file, options, buffer)
      if (frames.length > 1) return frames
    }
  } catch {
    // Fall through to browser decoding and static first-frame fallback below.
  }

  if ('ImageDecoder' in window) {
    const frames = await extractWithImageDecoder(file, options)
    if (frames.length > 0) return frames
  }

  return fallbackToStaticImageFrame(file, onProgress)
}

const waitForVideoEvent = (video, eventName) => {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener(eventName, onEvent)
      video.removeEventListener('error', onError)
    }
    const onEvent = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('视频解码失败'))
    }
    video.addEventListener(eventName, onEvent, { once: true })
    video.addEventListener('error', onError, { once: true })
  })
}

const seekVideo = async (video, time) => {
  const target = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.001))
  const promise = waitForVideoEvent(video, 'seeked')
  video.currentTime = target
  await promise
}

const extractVideoFrames = async (file, options) => {
  const {
    mode,
    fps,
    maxFrames,
    startTimeMs,
    endTimeMs,
    onStatus,
    onProgress,
  } = options

  onStatus('decoding')
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.playsInline = true
  video.src = url

  try {
    await waitForVideoEvent(video, 'loadedmetadata')
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
    const requestedFps = Math.max(1, Number(fps) || 1)
    const frameLimit = Math.max(1, Number(maxFrames) || 1)
    const startSeconds = Math.max(0, Number(startTimeMs || 0) / 1000)
    const endSeconds = Number.isFinite(Number(endTimeMs)) && Number(endTimeMs) > 0
      ? Math.min(duration, Number(endTimeMs) / 1000)
      : duration
    const rangeSeconds = Math.max(0, endSeconds - startSeconds) || duration
    const fpsFrameCount = Math.max(1, Math.ceil(rangeSeconds * requestedFps))
    const totalFrames = mode === 'fps' ? fpsFrameCount : Math.min(frameLimit, fpsFrameCount)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1
    canvas.height = video.videoHeight || 1
    const ctx = canvas.getContext('2d')
    const frames = []

    for (let index = 0; index < totalFrames; index++) {
      const timestamp = duration > 0 ? startSeconds + (index / requestedFps) : 0
      await seekVideo(video, timestamp)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      frames.push(await canvasToPngFrame(canvas, index, Math.round(timestamp * 1000)))
      onProgress(clampProgress(frames.length / totalFrames))
    }

    return frames
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const extractMediaFrames = async (file, options = {}) => {
  if (!file) {
    throw new Error('请选择动图或视频文件')
  }

  const normalizedOptions = {
    mode: options.mode || 'fpsAndMax',
    fps: options.fps || 5,
    maxFrames: options.maxFrames || 64,
    startTimeMs: options.startTimeMs || 0,
    endTimeMs: options.endTimeMs || 0,
    onStatus: options.onStatus || (() => {}),
    onProgress: options.onProgress || (() => {}),
  }

  normalizedOptions.onProgress(0)
  const frames = isVideoFile(file)
    ? await extractVideoFrames(file, normalizedOptions)
    : await extractAnimatedImageFrames(file, normalizedOptions)

  if (frames.length === 0) {
    throw new Error('未能从该媒体中提取到帧')
  }

  normalizedOptions.onProgress(1)
  return frames
}
