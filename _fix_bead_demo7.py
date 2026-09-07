path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = 'function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {'
si = content.index(old_start)
demos_idx = content.index('const DEMOS = {', si)
end_idx = content.rindex('}', si, demos_idx) + 1

new_demo = r"""function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // Scan line sweeps across: left side = soft gradient image,
  // right side = color-quantized bead dots with pegboard holes.
  // Pulse-completed view briefly before the loop resets.
  const T = 4.4;
  const p = (t % T) / T;
  const sweep = ease(p / 0.72) * (COLS + 2) - 1;
  const donePulse = p > 0.78 ? Math.sin(((p - 0.78) / 0.22) * Math.PI) * 0.06 : 0;

  // Heart shape data (returns 0 empty, 1 outline red, 2 fill pink)
  function beadColor(x: number, y: number): number {
    const dx = (x - COLS / 2 + 0.5) / (COLS * 0.32);
    const dy = -(y - ROWS / 2 + 0.5) / (ROWS * 0.36);
    const h = dx*dx + dy*dy - 1;
    const val = h*h*h - dx*dx * dy*dy*dy;
    if (val > 0) return 0; // empty
    if (val > -0.04) return 1; // outline
    return 2; // fill
  }

  const RED = '#E53935';
  const PINK = '#FF80AB';
  const HOLE = 'rgba(0,0,0,0.35)';

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const v = beadColor(x, y);
      if (x < sweep) {
        // Converted side: bead dots
        if (v === 0) {
          // Empty peg
          dotAt(ctx, x, y, DIM, 0.2);
        } else {
          const color = v === 1 ? RED : PINK;
          // Bead body
          dotAt(ctx, x, y, color, 0.32 + donePulse);
          // Peg hole in middle
          ctx.fillStyle = HOLE;
          ctx.beginPath();
          ctx.arc((x + 0.5) * CW, (y + 0.5) * CH, Math.min(CW, CH) * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Un-converted side: soft gradient squares (simulating source photo)
        if (v === 0) {
          ctx.fillStyle = `${GRAY} 0.06)`;
        } else {
          // Soft photo-like gradient
          const dist = Math.abs(x - COLS / 2) / (COLS / 2);
          const shade = v === 1 ? 0.7 : 0.45 + dist * 0.3;
          ctx.fillStyle = `rgba(${Math.floor(255 * shade)}, ${Math.floor(80 * shade)}, ${Math.floor(120 * shade)}, 0.9)`;
        }
        ctx.fillRect(x * CW + 1, y * CH + 1, CW - 2, CH - 2);
      }
    }
  }

  // Scan line
  if (sweep > 0 && sweep < COLS) {
    const sx = (sweep / COLS) * W;
    const grad = ctx.createLinearGradient(sx - 26, 0, sx, 0);
    grad.addColorStop(0, 'rgba(60, 140, 240, 0)');
    grad.addColorStop(1, 'rgba(60, 140, 240, 0.18)');
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
"""

content = content[:si] + new_demo + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
