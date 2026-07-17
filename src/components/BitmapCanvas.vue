<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  /** 1bpp bitmap: one entry per pixel (0/1) */
  bitmap: Uint8Array | null;
  /** Quantized RGBA pixels (width*height*4). Takes precedence over bitmap. */
  rgba?: Uint8ClampedArray | null;
  width: number;
  height: number;
  /** Device-pixel scale applied to the backing canvas */
  scale?: number;
  /** Foreground (lit pixel) color */
  fg?: string;
  /** Background color */
  bg?: string;
  grid?: boolean;
}>(), {
  rgba: null,
  scale: 2,
  fg: '#3ddc84',
  bg: '#10141b',
  grid: false
});

const canvas = ref<HTMLCanvasElement | null>(null);

function render() {
  const el = canvas.value;
  if (!el) return;
  const { width, height, scale } = props;
  el.width = Math.max(1, width * scale);
  el.height = Math.max(1, height * scale);
  const ctx = el.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = props.bg;
  ctx.fillRect(0, 0, el.width, el.height);

  const rgba = props.rgba;
  if (rgba && rgba.length >= width * height * 4) {
    // Color path: draw at 1:1 then scale up without smoothing.
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const offCtx = off.getContext('2d');
    if (offCtx) {
      offCtx.putImageData(new ImageData(new Uint8ClampedArray(rgba.subarray(0, width * height * 4)), width, height), 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, el.width, el.height);
    }
  } else {
    const bitmap = props.bitmap;
    if (bitmap && bitmap.length >= width * height) {
      ctx.fillStyle = props.fg;
      for (let y = 0; y < height; y += 1) {
        const row = y * width;
        for (let x = 0; x < width; x += 1) {
          if (bitmap[row + x]) ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }

  if (props.grid && scale >= 4) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * scale + 0.5, 0);
      ctx.lineTo(x * scale + 0.5, el.height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale + 0.5);
      ctx.lineTo(el.width, y * scale + 0.5);
      ctx.stroke();
    }
  }
}

onMounted(render);
watch(() => [props.bitmap, props.rgba, props.width, props.height, props.scale, props.fg, props.bg, props.grid], () => nextTick(render), { deep: false });
</script>

<template>
  <canvas ref="canvas" class="bitmap-canvas"></canvas>
</template>
