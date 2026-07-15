import type { ExtractedVideoFrame } from '../stores/videoModuloStore';

export interface VideoExtractionOptions {
  file: File;
  startTime: number;
  endTime: number;
  sampleFps: number;
  everyNFrames: number;
}

export interface ExtractedVideoResult {
  fileName: string;
  width: number;
  height: number;
  duration: number;
  objectUrl: string;
  frames: ExtractedVideoFrame[];
}

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

export async function extractVideoFrames(options: VideoExtractionOptions): Promise<ExtractedVideoResult> {
  if (options.sampleFps <= 0) {
    throw new Error('Sample FPS must be greater than 0');
  }
  const objectUrl = URL.createObjectURL(options.file);
  const video = document.createElement('video');
  video.src = objectUrl;
  video.muted = true;
  video.preload = 'metadata';
  video.crossOrigin = 'anonymous';
  await waitForEvent(video, 'loadedmetadata');

  const width = video.videoWidth;
  const height = video.videoHeight;
  const duration = video.duration;
  const end = Math.min(options.endTime || duration, duration);
  const step = Math.max(1 / Math.max(1, options.sampleFps), 0.001) * Math.max(1, options.everyNFrames);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');

  const frames: ExtractedVideoFrame[] = [];
  let lastActualTime = -1;
  for (let time = Math.max(0, options.startTime); time <= end + 0.0001; time += step) {
    const clampedTime = Math.min(time, duration);
    video.currentTime = clampedTime;
    await waitForEvent(video, 'seeked');
    if (Math.abs(video.currentTime - lastActualTime) < 0.0005) continue;
    lastActualTime = video.currentTime;
    context.drawImage(video, 0, 0, width, height);
    frames.push({
      time: video.currentTime,
      imageData: context.getImageData(0, 0, width, height)
    });
  }

  return {
    fileName: options.file.name,
    width,
    height,
    duration,
    objectUrl,
    frames
  };
}
