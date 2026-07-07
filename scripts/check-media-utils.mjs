import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  packImageDataToModulo,
  getBytesPerFrame,
  formatHexData,
  formatBinData,
} from '../src/utils/modulo.js'
import {
  getImageModuloBytesPerFrame,
  packImageDataByMode,
  renderModuloToRgba,
} from '../src/utils/imageModulo.js'
import {
  formatFrameArraysCode,
  formatAnimationStructCode,
  formatRawHexFrames,
  formatAnimationHeader,
} from '../src/utils/animationFormatters.js'
import {
  detectMediaTypeFromHeader,
  getMediaKind,
  inferMediaType,
  isSupportedForWorkflow,
} from '../src/utils/mediaTypes.js'

const imageData = {
  data: new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255,
  ]),
}

assert.deepEqual(
  packImageDataToModulo(imageData, 4, 2, {
    scanMode: 'row',
    encodingMode: '阴码',
    byteOrder: 'msb',
    threshold: 128,
  }),
  [0b10100000, 0b01010000]
)

assert.deepEqual(
  packImageDataToModulo(imageData, 4, 2, {
    scanMode: 'row',
    encodingMode: '阳码',
    byteOrder: 'msb',
    threshold: 128,
  }),
  [0b01010000, 0b10100000]
)

assert.deepEqual(
  packImageDataToModulo(imageData, 4, 2, {
    scanMode: 'column',
    encodingMode: '阴码',
    byteOrder: 'lsb',
    threshold: 128,
  }),
  [0b00000001, 0b00000010, 0b00000001, 0b00000010]
)

assert.equal(getBytesPerFrame(16, 16, 'row'), 32)
assert.equal(getBytesPerFrame(16, 16, 'column'), 32)
assert.equal(formatHexData([0, 10, 255]), '0x00, 0x0A, 0xFF')
assert.equal(formatBinData([5]), '00000101')

const previewImageData = {
  data: new Uint8ClampedArray([
    0, 0, 0, 255,
    255, 255, 255, 255,
  ]),
}

const monoYin = packImageDataByMode(previewImageData, 2, 1, {
  imageMode: 'mono',
  scanMode: 'row',
  encodingMode: '阴码',
  byteOrder: 'msb',
  threshold: 128,
})
assert.deepEqual(monoYin, [0b10000000])
assert.deepEqual(
  Array.from(renderModuloToRgba(monoYin, 2, 1, {
    imageMode: 'mono',
    scanMode: 'row',
    encodingMode: '阴码',
    byteOrder: 'msb',
  }).data),
  [17, 24, 39, 255, 255, 255, 255, 255]
)

const monoYang = packImageDataByMode(previewImageData, 2, 1, {
  imageMode: 'mono',
  scanMode: 'row',
  encodingMode: '阳码',
  byteOrder: 'msb',
  threshold: 128,
})
assert.deepEqual(monoYang, [0b01000000])
assert.deepEqual(
  Array.from(renderModuloToRgba(monoYang, 2, 1, {
    imageMode: 'mono',
    scanMode: 'row',
    encodingMode: '阳码',
    byteOrder: 'msb',
  }).data),
  [17, 24, 39, 255, 255, 255, 255, 255]
)

const colorImageData = {
  data: new Uint8ClampedArray([
    255, 0, 0, 255,
    255, 255, 255, 255,
  ]),
}

assert.equal(getImageModuloBytesPerFrame(2, 1, { imageMode: 'mono', scanMode: 'row' }), 1)
assert.equal(getImageModuloBytesPerFrame(2, 1, { imageMode: 'color', colorDepth: 4 }), 1)
assert.equal(getImageModuloBytesPerFrame(2, 1, { imageMode: 'color', colorDepth: 8 }), 2)
assert.equal(getImageModuloBytesPerFrame(2, 1, { imageMode: 'color', colorDepth: 16 }), 4)

const color4 = packImageDataByMode(colorImageData, 2, 1, {
  imageMode: 'color',
  colorDepth: 4,
})
assert.deepEqual(color4, [0x4F])
assert.deepEqual(
  Array.from(renderModuloToRgba(color4, 2, 1, {
    imageMode: 'color',
    colorDepth: 4,
  }).data),
  [170, 0, 0, 255, 255, 255, 255, 255]
)

const color8 = packImageDataByMode(colorImageData, 2, 1, {
  imageMode: 'color',
  colorDepth: 8,
})
assert.deepEqual(color8, [0xE0, 0xFF])
assert.deepEqual(
  Array.from(renderModuloToRgba(color8, 2, 1, {
    imageMode: 'color',
    colorDepth: 8,
  }).data),
  [255, 0, 0, 255, 255, 255, 255, 255]
)

const color16 = packImageDataByMode(colorImageData, 2, 1, {
  imageMode: 'color',
  colorDepth: 16,
})
assert.deepEqual(color16, [0xF8, 0x00, 0xFF, 0xFF])

const frames = [
  { index: 0, data: [0, 24] },
  { index: 1, data: [60, 255] },
]
const meta = { width: 8, height: 2, frameDelay: 200, bytesPerFrame: 2 }

const arrays = formatFrameArraysCode(frames)
assert.match(arrays, /anim_frame_000/)
assert.match(arrays, /anim_frame_001/)

const struct = formatAnimationStructCode(frames, meta)
assert.match(struct, /ANIM_WIDTH 8/)
assert.match(struct, /ANIM_HEIGHT 2/)
assert.match(struct, /ANIM_FRAME_COUNT 2/)
assert.match(struct, /AnimationBitmap/)

const raw = formatRawHexFrames(frames)
assert.match(raw, /\/\/ frame 0/)
assert.match(raw, /0x3C, 0xFF/)

const header = formatAnimationHeader(frames, meta)
assert.match(header, /extern const AnimationBitmap animation_bitmap;/)

const file = (name, type = '') => ({ name, type })

assert.equal(getMediaKind(file('demo.gif', 'image/gif')), 'animatedImage')
assert.equal(getMediaKind(file('demo.png', 'image/png')), 'animatedImage')
assert.equal(getMediaKind(file('demo.apng', 'image/apng')), 'animatedImage')
assert.equal(getMediaKind(file('demo.webp', 'image/webp')), 'animatedImage')
assert.equal(getMediaKind(file('demo.mp4', 'video/mp4')), 'video')
assert.equal(getMediaKind(file('demo.webm', 'video/webm')), 'video')
assert.equal(getMediaKind(file('demo.mov', '')), 'video')
assert.equal(getMediaKind(file('demo.txt', 'text/plain')), 'unsupported')

assert.equal(inferMediaType(file('demo.png', '')), 'image/png')
assert.equal(inferMediaType(file('demo.webm', '')), 'video/webm')
assert.equal(
  detectMediaTypeFromHeader(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), 'image/png'),
  'image/gif'
)
assert.equal(
  detectMediaTypeFromHeader(new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), ''),
  'image/png'
)
assert.equal(
  detectMediaTypeFromHeader(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), ''),
  'image/webp'
)
assert.equal(isSupportedForWorkflow(file('demo.webp', 'image/webp'), 'animatedImage'), true)
assert.equal(isSupportedForWorkflow(file('demo.webp', 'image/webp'), 'video'), false)
assert.equal(isSupportedForWorkflow(file('demo.mp4', 'video/mp4'), 'video'), true)
assert.equal(isSupportedForWorkflow(file('demo.mp4', 'video/mp4'), 'animatedImage'), false)

const extractorSource = readFileSync(new URL('../src/utils/mediaExtractor.js', import.meta.url), 'utf8')
assert.equal(extractorSource.includes('@ffmpeg/'), false, 'media extractor must not import FFmpeg WASM')
assert.match(extractorSource, /export const extractMediaFrames/)
assert.match(extractorSource, /fallbackToStaticImageFrame/)
assert.match(extractorSource, /extractGifFrames/)
assert.match(extractorSource, /extractApngFrames/)
assert.match(extractorSource, /decompressFrames/)
assert.match(extractorSource, /UPNG\.decode/)
