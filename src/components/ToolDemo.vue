<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Small looping dot-matrix animation demonstrating one tool's function.
 * Pure canvas — no assets. Dot-grid aesthetic matches BitmapCanvas colors.
 * Renders at devicePixelRatio (capped 2×) for crisp dots on HiDPI screens;
 * honors prefers-reduced-motion by drawing one static frame instead of looping.
 */
const props = defineProps<{
  type: 'image' | 'video' | 'animation' | 'font' | 'batch' | 'handdraw' | 'audio' | 'beadpattern' | 'aiagent';
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
let raf = 0;
let running = false;
let dpr = 1;

// Logical resolution — CSS scales the canvas responsively.
const W = 560;
const H = 240;

const BG = '#10141b';
const FG = '#3ddc84';
const FG_BRIGHT = '#8affc1';
const DIM = 'rgba(61, 220, 132, 0.18)';
const ACCENT = '#3c8cf0';
const GRAY = 'rgba(148, 163, 184,';

// ── Dot grid helpers ─────────────────────────────────

const COLS = 28;
const ROWS = 12;
const CW = W / COLS;
const CH = H / ROWS;

function dotAt(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, r = 0.32) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc((cx + 0.5) * CW, (cy + 0.5) * CH, Math.min(CW, CH) * r, 0, Math.PI * 2);
  ctx.fill();
}

/** Dot with a soft glow halo. Shadows are not free — use sparingly. */
function glowDot(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, r: number, blur: number) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  dotAt(ctx, cx, cy, color, r);
  ctx.restore();
}

/** Smoothstep clamp — phase transitions ease instead of snapping. */
function ease(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/** Soft circular "photo" as the conversion source: value 0..1 at grid cell. */
function sceneValue(x: number, y: number): number {
  const dx = x - COLS * 0.35;
  const dy = y - ROWS * 0.45;
  const circle = Math.max(0, 1 - Math.hypot(dx, dy) / 5.2);
  const hill = Math.max(0, 1 - Math.abs(y - (ROWS - 2.6 - Math.sin(x * 0.55) * 1.6)) / 2.2) * 0.65;
  return Math.min(1, circle + hill);
}

// Ordered 4x4 Bayer matrix for a recognizable dithering look.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// ── Per-tool demos (t in seconds) ────────────────────

function demoImage(ctx: CanvasRenderingContext2D, t: number) {
  // A scan line sweeps across with easing, converting a smooth image into
  // dithered dots; the finished result pulses once before the loop restarts.
  const T = 4.4;
  const p = (t % T) / T;
  const sweep = ease(p / 0.72) * (COLS + 2) - 1;
  const donePulse = p > 0.78 ? Math.sin(((p - 0.78) / 0.22) * Math.PI) * 0.06 : 0;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const v = sceneValue(x, y);
      if (x < sweep) {
        const on = v > (BAYER[(y % 4) * 4 + (x % 4)] + 1) / 17;
        if (on) dotAt(ctx, x, y, FG, 0.26 + v * 0.09 + donePulse);
        else dotAt(ctx, x, y, DIM, 0.11);
      } else {
        // Un-converted side: soft grayscale squares
        ctx.fillStyle = `${GRAY} ${0.08 + v * 0.55})`;
        ctx.fillRect(x * CW + 1, y * CH + 1, CW - 2, CH - 2);
      }
    }
  }
  if (sweep > 0 && sweep < COLS) {
    const sx = (sweep / COLS) * W;
    // Fading trail behind the scan line
    const grad = ctx.createLinearGradient(sx - 26, 0, sx, 0);
    grad.addColorStop(0, 'rgba(60, 140, 240, 0)');
    grad.addColorStop(1, 'rgba(60, 140, 240, 0.16)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 26, 0, 26, H);
    ctx.save();
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 9;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(sx - 1, 0, 2, H);
    ctx.restore();
  }
}

function demoVideo(ctx: CanvasRenderingContext2D, t: number) {
  // Bouncing ball with squash + motion trail; the timeline below accumulates
  // captured-frame ticks as the scrubber advances, flashing on each capture.
  const ballAt = (tt: number) => ({
    x: (Math.sin(tt * 1.4) * 0.5 + 0.5) * (COLS - 8) + 2,
    y: Math.abs(Math.sin(tt * 2.6)) * -(ROWS - 7) + ROWS - 5,
    bounce: Math.abs(Math.sin(tt * 2.6))
  });
  const ball = ballAt(t);
  const squash = 1 + (1 - ease(ball.bounce / 0.3)) * 0.45; // wider + flatter near ground
  for (let y = 0; y < ROWS - 2; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const dx = (x - ball.x) / squash;
      const dy = (y - ball.y) * squash;
      if (Math.hypot(dx, dy) < 2.1) dotAt(ctx, x, y, FG, 0.34);
      else dotAt(ctx, x, y, DIM, 0.1);
    }
  }
  // Motion trail: two ghost balls fading out
  for (let g = 1; g <= 2; g += 1) {
    const ghost = ballAt(t - g * 0.09);
    ctx.globalAlpha = 0.3 / g;
    for (let y = 0; y < ROWS - 2; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (Math.hypot(x - ghost.x, y - ghost.y) < 1.7) dotAt(ctx, x, y, FG, 0.22);
      }
    }
    ctx.globalAlpha = 1;
  }
  // Ground line
  for (let x = 0; x < COLS; x += 1) dotAt(ctx, x, ROWS - 3, DIM, 0.16);
  // Timeline with captured-frame ticks
  const barY = H * ((ROWS - 1) / ROWS);
  const barX = W * 0.08;
  const barW = W * 0.84;
  const progress = (t * 0.12) % 1;
  ctx.fillStyle = `${GRAY} 0.25)`;
  ctx.fillRect(barX, barY, barW, 2);
  ctx.fillStyle = 'rgba(60, 140, 240, 0.45)';
  ctx.fillRect(barX, barY, barW * progress, 2);
  for (let f = 0.06; f < progress; f += 0.08) {
    ctx.fillStyle = FG;
    ctx.fillRect(barX + barW * f - 1, barY - 3, 2, 4);
  }
  ctx.save();
  ctx.shadowColor = ACCENT;
  ctx.shadowBlur = 8;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(barX + progress * barW, barY + 1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Capture flash: brief frame border each time a tick lands
  const capPhase = (progress % 0.08) / 0.08;
  if (capPhase < 0.22) {
    ctx.strokeStyle = `rgba(138, 255, 193, ${0.5 * (1 - capPhase / 0.22)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, W - 6, H * ((ROWS - 2) / ROWS) - 6);
  }
}

// 3-frame invader-style walking sprite (8x8 each)
const WALK_FRAMES = [
  ['00111100', '01111110', '11011011', '11111111', '01111110', '00100100', '01000010', '10000001'],
  ['00111100', '01111110', '11011011', '11111111', '01111110', '00100100', '00100100', '00100100'],
  ['00111100', '01111110', '11011011', '11111111', '01111110', '00100100', '01000010', '00100100']
];

function drawMiniSprite(ctx: CanvasRenderingContext2D, sprite: string[], x: number, y: number, cell: number, color: string) {
  ctx.fillStyle = color;
  for (let sy = 0; sy < 8; sy += 1) {
    for (let sx = 0; sx < 8; sx += 1) {
      if (sprite[sy][sx] === '1') ctx.fillRect(x + sx * cell, y + sy * cell, cell - 0.5, cell - 0.5);
    }
  }
}

function demoAnimation(ctx: CanvasRenderingContext2D, t: number) {
  // The sprite strolls across the grid with a slight hop; the frame strip
  // below shows all three frames live, the active one glowing.
  const frameIndex = Math.floor(t * 5) % WALK_FRAMES.length;
  const sprite = WALK_FRAMES[frameIndex];
  const walkX = ((t * 2.2) % (COLS + 10)) - 5;
  const hop = Math.abs(Math.sin(t * 5 * Math.PI * 0.6)) * 0.4;
  // Faint backdrop grid so the empty area still reads as a dot matrix
  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < COLS; x += 2) dotAt(ctx, x, y, DIM, 0.07);
  }
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const gx = Math.round(walkX) + x;
      if (gx < 0 || gx >= COLS) continue;
      if (sprite[y][x] === '1') dotAt(ctx, gx, y + 1 - hop, FG, 0.34);
    }
  }
  // Frame strip: three live thumbnails
  const thumbW = W * 0.15;
  const gap = W * 0.05;
  const startX = (W - 3 * thumbW - 2 * gap) / 2;
  const thumbY = H * 0.8;
  const thumbH = H * 0.17;
  for (let i = 0; i < 3; i += 1) {
    const x = startX + i * (thumbW + gap);
    const active = i === frameIndex;
    ctx.save();
    if (active) {
      ctx.shadowColor = FG;
      ctx.shadowBlur = 7;
    }
    ctx.strokeStyle = active ? FG : `${GRAY} 0.3)`;
    ctx.lineWidth = active ? 2 : 1;
    ctx.strokeRect(x, thumbY, thumbW, thumbH);
    ctx.restore();
    const cell = thumbH / 9;
    drawMiniSprite(ctx, WALK_FRAMES[i], x + (thumbW - cell * 8) / 2, thumbY + cell * 0.5, cell, active ? FG : `${GRAY} 0.55)`);
  }
}

// 12x12 「字」 bitmap (hand-tuned, close enough at demo size)
const GLYPH = [
  '000111111000',
  '001000000100',
  '011111111110',
  '000000000000',
  '011111111110',
  '000000100000',
  '000001100000',
  '011111111110',
  '000001100000',
  '000001100000',
  '000001100000',
  '000111100000'
];

function demoFont(ctx: CanvasRenderingContext2D, t: number) {
  // Glyph pixels appear in scan order behind a glowing scan cursor; the row
  // being scanned shows its byte readout, then the glyph pulses and resets.
  const total = GLYPH.reduce((sum, row) => sum + [...row].filter((c) => c === '1').length, 0);
  const T = 3.6;
  const p = (t % T) / T;
  const revealed = Math.min(total, Math.floor(ease(p / 0.66) * total));
  const donePulse = p > 0.72 ? Math.sin(((p - 0.72) / 0.28) * Math.PI) : 0;
  const offX = Math.floor((COLS - 12) / 2);
  let seen = 0;
  let cursorCell: [number, number] | null = null;
  let cursorRow = 0;
  for (let y = 0; y < 12; y += 1) {
    for (let x = 0; x < 12; x += 1) {
      const gy = Math.floor((y * ROWS) / 12);
      if (GLYPH[y][x] === '1') {
        seen += 1;
        if (seen <= revealed) {
          const isFresh = revealed - seen < 5;
          dotAt(ctx, offX + x, gy, isFresh ? FG_BRIGHT : FG, 0.3 + donePulse * 0.05);
          if (seen === revealed) {
            cursorCell = [offX + x, gy];
            cursorRow = y;
          }
        }
      } else if ((x + y) % 2 === 0) {
        dotAt(ctx, offX + x, gy, DIM, 0.07);
      }
    }
  }
  if (cursorCell && revealed < total) {
    glowDot(ctx, cursorCell[0], cursorCell[1], '#ffffff', 0.18, 8);
    // Byte readout of the row currently under the scan cursor
    const rowBits = GLYPH[cursorRow];
    const hi = parseInt(rowBits.slice(0, 8), 2).toString(16).toUpperCase().padStart(2, '0');
    const lo = parseInt(rowBits.slice(8).padEnd(8, '0'), 2).toString(16).toUpperCase().padStart(2, '0');
    ctx.fillStyle = `${GRAY} 0.75)`;
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`0x${hi} 0x${lo}`, W * 0.75, H * 0.93);
  }
  // Blinking text cursor on the left
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(W * 0.12, H * 0.25, 2, H * 0.5);
  }
}

function demoBatch(ctx: CanvasRenderingContext2D, t: number) {
  // Three queued thumbnails converting one after another; the active card
  // gets a glowing border, finished cards a pop-in checkmark.
  const cycle = (t * 0.45) % 3.9;
  for (let i = 0; i < 3; i += 1) {
    const cx = W * (0.14 + i * 0.3);
    const cw = W * 0.22;
    const cy = H * 0.12;
    const chh = H * 0.55;
    const progress = Math.max(0, Math.min(1, cycle - i));
    const active = progress > 0 && progress < 1;
    ctx.save();
    if (active) {
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = ACCENT;
    } else {
      ctx.strokeStyle = progress >= 1 ? 'rgba(61, 220, 132, 0.5)' : `${GRAY} 0.25)`;
    }
    ctx.lineWidth = active ? 1.5 : 1;
    ctx.strokeRect(cx - 5, cy - 5, cw + 10, chh + 10);
    ctx.restore();
    // Thumbnail: dots convert top→bottom by progress
    const cols = 7;
    const rows = 5;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const v = sceneValue(x * 4, y * 2.4);
        const converted = y / rows < progress;
        ctx.fillStyle = converted ? (v > 0.35 ? FG : DIM) : `${GRAY} ${0.1 + v * 0.4})`;
        ctx.beginPath();
        ctx.arc(cx + (x + 0.5) * (cw / cols), cy + (y + 0.5) * (chh / rows), Math.min(cw / cols, chh / rows) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Progress bar
    const barY = H * 0.8;
    ctx.fillStyle = `${GRAY} 0.25)`;
    ctx.fillRect(cx, barY, cw, 3);
    ctx.fillStyle = progress >= 1 ? FG : ACCENT;
    ctx.fillRect(cx, barY, cw * progress, 3);
    // Pop-in checkmark once done
    if (progress >= 1) {
      const k = ease((cycle - i - 1) / 0.3);
      if (k > 0) {
        ctx.save();
        ctx.strokeStyle = FG_BRIGHT;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.shadowColor = FG;
        ctx.shadowBlur = 6;
        const mx = cx + cw - 6;
        const my = cy + 8;
        ctx.beginPath();
        ctx.moveTo(mx - 7 * k, my + 0.5 * k);
        ctx.lineTo(mx - 3 * k, my + 4 * k);
        ctx.lineTo(mx + 4 * k, my - 4 * k);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// Left half of a pixel heart; the right half is auto-mirrored around
// MIRROR_AXIS — showcasing the editor's mirror-symmetry mode.
const MIRROR_AXIS = 14;
const HEART_HALF: [number, number][] = [
  [14, 4], [13, 3], [12, 2], [11, 2], [10, 3], [9, 4],
  [9, 5], [10, 6], [11, 7], [12, 8], [13, 9], [14, 10]
];

function demoHanddraw(ctx: CanvasRenderingContext2D, t: number) {
  const T = 3.6;
  const p = (t % T) / T;
  const drawn = Math.min(HEART_HALF.length, Math.floor(ease(p / 0.62) * (HEART_HALF.length + 1)));
  const donePulse = p > 0.68 ? Math.sin(((p - 0.68) / 0.32) * Math.PI) : 0;
  // Faint grid
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 6; x < COLS - 6; x += 1) {
      dotAt(ctx, x, y, `${GRAY} 0.09)`, 0.08);
    }
  }
  // Mirror axis: dashed vertical line
  ctx.save();
  ctx.strokeStyle = 'rgba(60, 140, 240, 0.4)';
  ctx.setLineDash([4, 5]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((MIRROR_AXIS + 0.5) * CW, 4);
  ctx.lineTo((MIRROR_AXIS + 0.5) * CW, H - 4);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < drawn; i += 1) {
    const [x, y] = HEART_HALF[i];
    const r = 0.36 + donePulse * 0.05;
    dotAt(ctx, x, y, '#ff6b9d', r);
    const mx = 2 * MIRROR_AXIS - x;
    if (mx !== x) dotAt(ctx, mx, y, '#ff9dbf', r); // mirrored side, lighter tint
  }
  // Pencil cursor on the latest cell + ghost cursor on its mirror
  if (drawn > 0 && drawn < HEART_HALF.length) {
    const [x, y] = HEART_HALF[drawn - 1];
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x * CW, y * CH, CW, CH);
    const mx = 2 * MIRROR_AXIS - x;
    if (mx !== x) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeRect(mx * CW, y * CH, CW, CH);
    }
  }
}

function demoAudio(ctx: CanvasRenderingContext2D, t: number) {
  // Right of the playhead: the raw analog waveform as a smooth curve.
  // Left: quantized PCM dots snapped to the grid, with a data-bit readout.
  const playhead = ((t * 0.35) % 1.2) * COLS;
  const mid = ((ROWS - 1) / 2) * CH + CH / 2;
  const signal = (x: number) => {
    const phase = x * 0.55 + t * 2.2;
    return (Math.sin(phase) * 0.5 + Math.sin(phase * 0.37 + 1.3) * 0.3 + Math.sin(phase * 1.7) * 0.2)
      * (0.55 + 0.45 * Math.sin(x * 0.21 + t * 0.9));
  };
  // Analog side: smooth continuous curve
  ctx.save();
  ctx.strokeStyle = `${GRAY} 0.55)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  let started = false;
  for (let px = Math.max(0, playhead * CW); px <= W; px += 4) {
    const v = signal(px / CW);
    const y = mid - v * (ROWS / 2 - 1.4) * CH;
    if (!started) {
      ctx.moveTo(px, y);
      started = true;
    } else ctx.lineTo(px, y);
  }
  ctx.stroke();
  ctx.restore();
  // Quantized side: dot columns, peak dots brighter
  for (let x = 0; x < Math.min(COLS, playhead); x += 1) {
    const v = signal(x + 0.5);
    const half = Math.max(0.6, Math.abs(v) * (ROWS / 2 - 1.4));
    for (let y = 0; y < ROWS - 1; y += 1) {
      const dist = Math.abs(y - (ROWS - 1) / 2 + 0.5);
      if (dist <= half) {
        const isPeak = half - dist < 1;
        dotAt(ctx, x, y, isPeak ? FG_BRIGHT : FG, isPeak ? 0.3 : 0.24);
      } else {
        dotAt(ctx, x, y, DIM, 0.07);
      }
    }
  }
  // Playhead line with glow + top marker
  if (playhead > 0 && playhead < COLS) {
    const sx = (playhead / COLS) * W;
    ctx.save();
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 9;
    ctx.fillStyle = ACCENT;
    ctx.fillRect(sx - 1, 0, 2, H * ((ROWS - 1) / ROWS));
    ctx.beginPath();
    ctx.moveTo(sx - 4, 0);
    ctx.lineTo(sx + 4, 0);
    ctx.lineTo(sx, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // Bottom bit ticks: filled square when the sample is positive — reads as data
  for (let x = 0; x < COLS; x += 1) {
    if (x < playhead) {
      const bit = signal(x + 0.5) > 0;
      ctx.fillStyle = bit ? FG : 'rgba(61, 220, 132, 0.3)';
      const size = bit ? 4 : 2.5;
      ctx.fillRect((x + 0.5) * CW - size / 2, (ROWS - 0.5) * CH - size / 2, size, size);
    } else if (x % 2 === 0) {
      dotAt(ctx, x, ROWS - 1, DIM, 0.1);
    }
  }
}

function demoAiAgent(ctx: CanvasRenderingContext2D, t: number) {
  // Code lines flow into a pulsing AI chip; the chip lights up a screen
  // (smiley) on the right and emits glowing sound waves below it.

  // Left: scrolling code lines (dim dashes of varying width)
  for (let i = 0; i < 6; i += 1) {
    const y = ((i * 2.1 + t * 1.6) % ROWS + ROWS) % ROWS;
    const len = 3 + ((i * 7) % 4);
    const flow = (t * 6 + i * 3) % (COLS * 0.34);
    for (let x = 0; x < len; x += 1) {
      const cx = 1 + x + flow * 0.4;
      if (cx < COLS * 0.3) dotAt(ctx, cx, y, `${GRAY} 0.4)`, 0.14);
    }
  }

  // Center: chip with pulsing, glowing core
  const chipX = W * 0.38;
  const chipY = H * 0.24;
  const chipW = W * 0.2;
  const chipH = H * 0.52;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
  ctx.strokeStyle = FG;
  ctx.lineWidth = 2;
  ctx.strokeRect(chipX, chipY, chipW, chipH);
  ctx.fillStyle = `${GRAY} 0.6)`;
  for (let i = 0; i < 4; i += 1) {
    const py = chipY + chipH * (0.2 + i * 0.2);
    ctx.fillRect(chipX - 5, py, 5, 2);
    ctx.fillRect(chipX + chipW, py, 5, 2);
  }
  ctx.save();
  ctx.shadowColor = FG;
  ctx.shadowBlur = 6 + pulse * 10;
  ctx.fillStyle = `rgba(61, 220, 132, ${0.25 + pulse * 0.6})`;
  ctx.fillRect(chipX + chipW * 0.22, chipY + chipH * 0.28, chipW * 0.56, chipH * 0.44);
  ctx.restore();
  ctx.fillStyle = '#0b0e13';
  ctx.font = `bold ${Math.round(H * 0.16)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI', chipX + chipW / 2, chipY + chipH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Right-top: mini screen whose smiley lights up dot by dot
  const face: [number, number][] = [
    [1, 1], [3, 1], [0, 3], [1, 4], [2, 4], [3, 4], [4, 3]
  ];
  const screenX = Math.floor(COLS * 0.72);
  const reveal = Math.min(face.length, Math.floor(((t * 0.8) % 1.6) / 1.1 * (face.length + 2)));
  ctx.strokeStyle = `${GRAY} 0.5)`;
  ctx.lineWidth = 1;
  ctx.strokeRect((screenX - 1) * CW, CH * 0.6, CW * 7, CH * 6.4);
  for (let i = 0; i < reveal; i += 1) {
    const [x, y] = face[i];
    const fresh = i === reveal - 1;
    if (fresh) glowDot(ctx, screenX + x, y + 1.2, FG_BRIGHT, 0.3, 6);
    else dotAt(ctx, screenX + x, y + 1.2, FG, 0.3);
  }

  // Right-bottom: speaker + expanding sound arcs
  const spkX = (screenX + 0.6) * CW;
  const spkY = H * 0.8;
  ctx.fillStyle = `${GRAY} 0.7)`;
  ctx.beginPath();
  ctx.moveTo(spkX, spkY - 4);
  ctx.lineTo(spkX + 5, spkY - 4);
  ctx.lineTo(spkX + 10, spkY - 9);
  ctx.lineTo(spkX + 10, spkY + 9);
  ctx.lineTo(spkX + 5, spkY + 4);
  ctx.lineTo(spkX, spkY + 4);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    const phase = (t * 1.4 + i * 0.33) % 1;
    ctx.strokeStyle = `rgba(60, 140, 240, ${0.9 - phase * 0.9})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(spkX + 10, spkY, 4 + phase * 16, -0.7, 0.7);
    ctx.stroke();
  }

  // Flow arrows: input → chip → outputs
  const dash = Math.floor(t * 8) % 3;
  ctx.fillStyle = ACCENT;
  for (let i = 0; i < 3; i += 1) {
    ctx.globalAlpha = i === dash ? 1 : 0.25;
    ctx.fillRect(W * 0.3 + i * 8, H * 0.5 - 1, 5, 2);
    ctx.fillRect(chipX + chipW + 6 + i * 8, H * 0.5 - 1, 5, 2);
  }
  ctx.globalAlpha = 1;
}

function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // A small bead grid fills in color-by-color, simulating pattern generation.
  // Each bead is a colored circle in a grid, with a materials legend on the right.
  const BEAD_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FFD600', '#7B1FA2', '#FF9100', '#FFFFFF', '#212121'];
  const GRID_COLS = 12;
  const GRID_ROWS = 10;
  const cell = Math.min(CW, CH) * 1.6;
  const startX = (W - GRID_COLS * cell) / 2 - 40;
  const startY = (H - GRID_ROWS * cell) / 2;

  // Generate a simple smiley face pattern
  const smiley: (number | null)[][] = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    smiley[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      const dx = x - 5.5, dy = y - 4.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5.2) smiley[y][x] = 3; // yellow face
      else smiley[y][x] = null;
    }
  }
  // Eyes
  smiley[3][3] = 7; smiley[3][4] = 7;
  smiley[3][7] = 7; smiley[3][8] = 7;
  // Mouth
  smiley[6][3] = 7; smiley[6][4] = 7;
  smiley[6][7] = 7; smiley[6][8] = 7;
  smiley[7][5] = 7; smiley[7][6] = 7;

  const totalBeads = GRID_ROWS * GRID_COLS;
  const T = 4.0;
  const p = (t % T) / T;
  const revealed = Math.floor(ease(p) * totalBeads);

  // Draw grid
  let count = 0;
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const bx = startX + x * cell;
      const by = startY + y * cell;
      const colorIdx = smiley[y][x];
      if (count < revealed && colorIdx !== null) {
        ctx.save();
        if (count === revealed - 1) {
          ctx.shadowColor = BEAD_COLORS[colorIdx];
          ctx.shadowBlur = 6;
        }
        ctx.fillStyle = BEAD_COLORS[colorIdx];
        ctx.beginPath();
        ctx.arc(bx + cell / 2, by + cell / 2, cell * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Empty peg board
        ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.beginPath();
        ctx.arc(bx + cell / 2, by + cell / 2, cell * 0.36, 0, Math.PI * 2);
        ctx.fill();
      }
      count++;
    }
  }

  // Legend on the right side
  const legX = startX + GRID_COLS * cell + 20;
  const legY = startY + 8;
  ctx.fillStyle = `${GRAY} 0.5)`;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const usedColors = [3, 7]; // yellow and black in the smiley
  usedColors.forEach((ci, i) => {
    const ly = legY + i * 18;
    ctx.fillStyle = BEAD_COLORS[ci];
    ctx.beginPath();
    ctx.arc(legX + 6, ly, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `${GRAY} 0.75)`;
    ctx.fillText(`× ${Math.floor(Math.random() * 30 + 10)}`, legX + 16, ly);
  });

  // Board boundary dashes
  ctx.save();
  ctx.strokeStyle = 'rgba(60, 140, 240, 0.3)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeRect(startX - 2, startY - 2, GRID_COLS * cell + 4, GRID_ROWS * cell + 4);
  ctx.restore();
}

const DEMOS = {
  image: demoImage,
  video: demoVideo,
  animation: demoAnimation,
  font: demoFont,
  batch: demoBatch,
  handdraw: demoHanddraw,
  audio: demoAudio,
  beadpattern: demoBeadPattern,
  aiagent: demoAiAgent
} as const;

// ── Render loop (paused off-screen via IntersectionObserver) ──

let observer: IntersectionObserver | null = null;

function paint(ctx: CanvasRenderingContext2D, t: number) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  DEMOS[props.type](ctx, t);
}

function frame(now: number) {
  const el = canvas.value;
  if (!el || !running) return;
  const ctx = el.getContext('2d');
  if (ctx) paint(ctx, now / 1000);
  raf = requestAnimationFrame(frame);
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function start() {
  if (running) return;
  if (prefersReducedMotion()) {
    // One representative frame, no animation loop
    const ctx = canvas.value?.getContext('2d');
    if (ctx) paint(ctx, 2.1);
    return;
  }
  running = true;
  raf = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  cancelAnimationFrame(raf);
}

onMounted(() => {
  const el = canvas.value;
  if (!el) return;
  // Fixed logical resolution rendered at devicePixelRatio; CSS scales it.
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  el.width = W * dpr;
  el.height = H * dpr;
  observer = new IntersectionObserver(
    (entries) => { entries[0].isIntersecting ? start() : stop(); },
    { threshold: 0.05 }
  );
  observer.observe(el);
});

onBeforeUnmount(() => {
  stop();
  observer?.disconnect();
});
</script>

<template>
  <canvas ref="canvas" class="tool-demo" :aria-label="`${type} demo animation`"></canvas>
</template>
