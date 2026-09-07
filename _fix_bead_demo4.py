path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = 'function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {'
si = content.index(old_start)
demos_idx = content.index('const DEMOS = {', si)
end_idx = content.rindex('}', si, demos_idx) + 1

new_demo = r"""function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // Bead pattern demo: pegboard with a heart shape filling bead by bead.
  // Shows the core value: image -> color-matched bead pattern.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Background: faint peg grid
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.beginPath();
      ctx.arc((x + 0.5) * CW, (y + 0.5) * CH, Math.min(CW, CH) * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Heart shape on a 20x16 bead grid (centered)
  const BCOLS = 20, BROWS = 16;
  const bx = (COLS - BCOLS) / 2;
  const by = (ROWS - BROWS) / 2;
  const cell = Math.min(CW, CH);

  // Build heart pattern
  const heart: number[][] = [];
  for (let y = 0; y < BROWS; y++) {
    heart[y] = [];
    for (let x = 0; x < BCOLS; x++) {
      const dx = (x - BCOLS / 2 + 0.5) / (BCOLS * 0.4);
      const dy = -(y - BROWS / 2 + 0.5) / (BROWS * 0.42);
      const h = dx*dx + dy*dy - 1;
      const val = h*h*h - dx*dx * dy*dy*dy;
      if (val < 0) {
        heart[y][x] = val > -0.06 ? 0 : 1; // 0=outline red, 1=fill pink
      } else {
        heart[y][x] = -1;
      }
    }
  }

  // Count beads for reveal animation
  let beadPositions: { x: number; y: number; ci: number }[] = [];
  for (let y = 0; y < BROWS; y++) {
    for (let x = 0; x < BCOLS; x++) {
      if (heart[y][x] >= 0) {
        beadPositions.push({ x, y, ci: heart[y][x] });
      }
    }
  }

  const T = 3.5;
  const p = (t % T) / T;
  const revealCount = Math.floor(ease(p) * beadPositions.length);

  // Pegboard background frame
  const boardX = bx * CW - cell * 0.4;
  const boardY = by * CH - cell * 0.4;
  const boardW = BCOLS * cell + cell * 0.8;
  const boardH = BROWS * cell + cell * 0.8;
  ctx.fillStyle = '#2a2418';
  roundRect(ctx, boardX, boardY, boardW, boardH, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 140, 60, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pegs + beads
  const COLORS = ['#E91E63', '#FF80AB'];

  for (let i = 0; i < beadPositions.length; i++) {
    const bp = beadPositions[i];
    const cx = (bx + bp.x + 0.5) * CW;
    const cy = (by + bp.y + 0.5) * CH;
    const placed = i < revealCount;

    if (placed) {
      const color = COLORS[bp.ci];
      // Glow on latest bead
      if (i === revealCount - 1) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
      }
      // Bead body with 3D gradient
      const grd = ctx.createRadialGradient(
        cx - cell * 0.08, cy - cell * 0.08, cell * 0.06,
        cx, cy, cell * 0.38
      );
      grd.addColorStop(0, lightenColor(color, 0.35));
      grd.addColorStop(1, color);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.38, 0, Math.PI * 2);
      ctx.fill();
      // Hole
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.12, 0, Math.PI * 2);
      ctx.fill();
      if (i === revealCount - 1) ctx.restore();
    } else {
      // Empty peg
      ctx.fillStyle = 'rgba(120, 100, 60, 0.3)';
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = BG;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Color code label on the side
  const labelX = boardX + boardW + 8;
  const labelY = boardY + 6;

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const legend = [
    { code: 'A1', name: 'Red', color: COLORS[0], count: beadPositions.filter(b => b.ci === 0).length },
    { code: 'A3', name: 'Pink', color: COLORS[1], count: beadPositions.filter(b => b.ci === 1).length },
  ];

  legend.forEach((item, i) => {
    const ly = labelY + i * 16;
    // Bead swatch
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(labelX + 5, ly, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(labelX + 5, ly, 1.2, 0, Math.PI * 2);
    ctx.fill();
    // Code
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(item.code, labelX + 14, ly);
    // Count
    const shownCount = Math.min(item.count, Math.floor(revealCount * (item.count / beadPositions.length)));
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.font = '8px monospace';
    ctx.fillText('x' + shownCount, labelX + 34, ly);
  });

  // Total beads counter at bottom
  const total = beadPositions.length;
  const shown = Math.min(total, revealCount);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${shown} / ${total} beads`, W / 2, boardY + boardH + 14);
}
"""

content = content[:si] + new_demo + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
