import type { ExtractedVideoFrame } from '../stores/videoModuloStore';

export interface VideoExtractionOptions {
  file: File;
  startTime: number;
  endTime: number;
  /** Sampling rate, in frames per `sampleUnit` (default: per second). */
  sampleFps: number;
  /** Time base for `sampleFps`: 10 + 'minute' → one frame every 6 s. */
  sampleUnit?: 'second' | 'minute';
  everyNFrames: number;
  /**
   * Cap the capture canvas's long edge. Dot-matrix targets are tiny (≤512),
   * so capturing at a bounded resolution keeps getImageData cheap without
   * hurting the downscaled output. 0 disables the cap (capture at source res).
   */
  captureMaxEdge?: number;
  /** Progress callback: (framesCaptured, approxTotal). */
  onProgress?: (captured: number, approxTotal: number) => void;
}

export interface ExtractedVideoResult {
  fileName: string;
  width: number;
  height: number;
  duration: number;
  objectUrl: string;
  frames: ExtractedVideoFrame[];
}

const DEFAULT_CAPTURE_MAX_EDGE = 640;
// Above this sampling interval (seconds), seeking straight to each sample
// beats playing the video through, even with the keyframe-rewind cost.
const SEEK_INTERVAL_THRESHOLD = 2;

function waitForEvent(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = () => {
      cleanup();
      reject(new Error(`Video failed while waiting for ${event}`));
    };
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      target.removeEventListener(event, onEvent);
      target.removeEventListener('error', onError);
    };
    target.addEventListener(event, onEvent, { once: true });
    target.addEventListener('error', onError, { once: true });
  });
}

/** Capture dimensions preserving the source ratio, bounded by maxEdge. */
function captureSize(width: number, height: number, maxEdge: number): { w: number; h: number } {
  if (!maxEdge || Math.max(width, height) <= maxEdge) return { w: width, h: height };
  const scale = maxEdge / Math.max(width, height);
  return {
    w: Math.max(1, Math.round(width * scale)),
    h: Math.max(1, Math.round(height * scale)),
  };
}

function supportsVideoFrameCallback(video: HTMLVideoElement): boolean {
  return typeof (video as any).requestVideoFrameCallback === 'function';
}

/**
 * Fast path: play the video muted at an elevated rate and grab frames as the
 * decoder presents them (requestVideoFrameCallback). Decoding is linear, so
 * this avoids the per-seek keyframe-rewind penalty entirely.
 */
function extractViaPlayback(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  start: number,
  end: number,
  interval: number,
  onProgress?: (captured: number, approxTotal: number) => void,
): Promise<ExtractedVideoFrame[]> {
  const frames: ExtractedVideoFrame[] = [];
  const approxTotal = Math.max(1, Math.ceil((end - start) / interval));
  let lastCaptured = -Infinity;
  let done = false;

  return new Promise<ExtractedVideoFrame[]>((resolve, reject) => {
    const rvfc = (video as any).requestVideoFrameCallback.bind(video);

    const finish = () => {
      if (done) return;
      done = true;
      video.pause();
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
      resolve(frames);
    };
    const onError = () => {
      if (done) return;
      done = true;
      video.removeEventListener('ended', onEnded);
      reject(new Error('Video decoding failed during extraction'));
    };
    const onEnded = () => finish();

    const onFrame = (_now: number, meta: { mediaTime: number }) => {
      if (done) return;
      const t = meta.mediaTime;
      if (t + 1e-4 >= start && t - lastCaptured >= interval - 1e-4) {
        lastCaptured = t;
        ctx.drawImage(video, 0, 0, cw, ch);
        frames.push({ time: t, imageData: ctx.getImageData(0, 0, cw, ch) });
        onProgress?.(frames.length, approxTotal);
      }
      if (t >= end - 1e-4) {
        finish();
        return;
      }
      rvfc(onFrame);
    };

    video.addEventListener('error', onError, { once: true });
    video.addEventListener('ended', onEnded, { once: true });
    // Elevated rate: we only sample a fraction of frames, so dropped
    // presentation frames don't matter — mediaTime gating stays accurate.
    // Coarser sampling tolerates a higher rate (fewer frames to catch).
    video.playbackRate = Math.min(16, Math.max(4, Math.round(interval * 30)));
    rvfc(onFrame);
    video.play().catch((err) => {
      if (done) return;
      done = true;
      reject(err instanceof Error ? err : new Error('Video playback was blocked'));
    });
  });
}

/** Fallback path: seek frame by frame (slow, but works without rVFC support). */
async function extractViaSeek(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  start: number,
  end: number,
  step: number,
  duration: number,
  onProgress?: (captured: number, approxTotal: number) => void,
): Promise<ExtractedVideoFrame[]> {
  const frames: ExtractedVideoFrame[] = [];
  const approxTotal = Math.max(1, Math.ceil((end - start) / step));
  let lastActualTime = -1;
  for (let time = start; time <= end + 0.0001; time += step) {
    video.currentTime = Math.min(time, duration);
    await waitForEvent(video, 'seeked');
    if (Math.abs(video.currentTime - lastActualTime) < 0.0005) continue;
    lastActualTime = video.currentTime;
    ctx.drawImage(video, 0, 0, cw, ch);
    frames.push({ time: video.currentTime, imageData: ctx.getImageData(0, 0, cw, ch) });
    onProgress?.(frames.length, approxTotal);
  }
  return frames;
}

export async function extractVideoFrames(options: VideoExtractionOptions): Promise<ExtractedVideoResult> {
  if (options.sampleFps <= 0) {
    throw new Error('Sample rate must be greater than 0');
  }
  const objectUrl = URL.createObjectURL(options.file);
  const video = document.createElement('video');
  video.src = objectUrl;
  video.muted = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  (video as any).playsInline = true;
  await waitForEvent(video, 'loadedmetadata');

  const width = video.videoWidth;
  const height = video.videoHeight;
  const duration = video.duration;
  const start = Math.max(0, options.startTime);
  const end = Math.min(options.endTime || duration, duration);
  const framesPerSecond = options.sampleUnit === 'minute' ? options.sampleFps / 60 : options.sampleFps;
  const interval = Math.max(1 / Math.max(framesPerSecond, 1e-6), 0.001) * Math.max(1, options.everyNFrames);

  const maxEdge = options.captureMaxEdge ?? DEFAULT_CAPTURE_MAX_EDGE;
  const { w: cw, h: ch } = captureSize(width, height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is unavailable');

  // Sparse sampling (frames seconds apart) is faster via direct seeks: even
  // at 16x, linear playback of a 10-minute clip takes ~40s, while a few dozen
  // keyframe-aligned seeks finish in a couple of seconds.
  const preferSeek = interval >= SEEK_INTERVAL_THRESHOLD;

  let frames: ExtractedVideoFrame[];
  if (supportsVideoFrameCallback(video) && !preferSeek) {
    // Seek to the start once, then let linear playback do the rest.
    if (start > 0) {
      video.currentTime = start;
      await waitForEvent(video, 'seeked');
    }
    frames = await extractViaPlayback(video, context, cw, ch, start, end, interval, options.onProgress);
    // Rare miss (e.g. immediate 'ended'): fall back to a seek pass.
    if (frames.length === 0) {
      frames = await extractViaSeek(video, context, cw, ch, start, end, interval, duration, options.onProgress);
    }
  } else {
    frames = await extractViaSeek(video, context, cw, ch, start, end, interval, duration, options.onProgress);
  }

  return {
    fileName: options.file.name,
    width,
    height,
    duration,
    objectUrl,
    frames,
  };
}
