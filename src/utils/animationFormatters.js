import { formatHexData } from './modulo.js'

const frameName = (index) => `anim_frame_${String(index).padStart(3, '0')}`

const frameData = (frame) => {
  return frame.data || []
}

export const formatFrameArraysCode = (frames) => {
  return frames.map((frame, index) => {
    const name = frameName(frame.index ?? index)
    return `const uint8_t ${name}[] = {\n    ${formatHexData(frameData(frame))}\n};`
  }).join('\n\n')
}

export const formatRawHexFrames = (frames) => {
  return frames.map((frame, index) => {
    const frameIndex = frame.index ?? index
    return `// frame ${frameIndex}\n${formatHexData(frameData(frame))}`
  }).join('\n\n')
}

export const formatAnimationStructCode = (frames, meta) => {
  const frameArrays = formatFrameArraysCode(frames)
  const framePointers = frames
    .map((frame, index) => `    ${frameName(frame.index ?? index)}`)
    .join(',\n')

  return `#include <stdint.h>

#define ANIM_WIDTH ${meta.width}
#define ANIM_HEIGHT ${meta.height}
#define ANIM_FRAME_COUNT ${frames.length}
#define ANIM_FRAME_DELAY_MS ${meta.frameDelay}
#define ANIM_BYTES_PER_FRAME ${meta.bytesPerFrame}

${frameArrays}

const uint8_t* const anim_frames[ANIM_FRAME_COUNT] = {
${framePointers}
};

typedef struct {
    uint16_t width;
    uint16_t height;
    uint16_t frameCount;
    uint16_t frameDelayMs;
    uint16_t bytesPerFrame;
    const uint8_t* const* frames;
} AnimationBitmap;

const AnimationBitmap animation_bitmap = {
    ANIM_WIDTH,
    ANIM_HEIGHT,
    ANIM_FRAME_COUNT,
    ANIM_FRAME_DELAY_MS,
    ANIM_BYTES_PER_FRAME,
    anim_frames
};`
}

export const formatAnimationHeader = (frames, meta) => {
  return `#ifndef ANIMATION_BITMAP_H
#define ANIMATION_BITMAP_H

#include <stdint.h>

#define ANIM_WIDTH ${meta.width}
#define ANIM_HEIGHT ${meta.height}
#define ANIM_FRAME_COUNT ${frames.length}
#define ANIM_FRAME_DELAY_MS ${meta.frameDelay}
#define ANIM_BYTES_PER_FRAME ${meta.bytesPerFrame}

typedef struct {
    uint16_t width;
    uint16_t height;
    uint16_t frameCount;
    uint16_t frameDelayMs;
    uint16_t bytesPerFrame;
    const uint8_t* const* frames;
} AnimationBitmap;

extern const AnimationBitmap animation_bitmap;

#endif`
}
