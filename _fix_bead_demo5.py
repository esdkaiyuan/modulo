path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = 'function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {'
si = content.index(old_start)
demos_idx = content.index('const DEMOS = {', si)
end_idx = content.rindex('}', si, demos_idx) + 1

new_demo = r"""function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // Bead pattern demo: photo -> pixelate -> color-quantized bead pattern
  // Shows the core workflow: image in, bead pattern out with color codes.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const T = 4.0;
  const p = (t % T) / T;

  // Layout: source image on left, arrow in middle, bead pattern on right
  const imgW = W * 0.32;
  const imgH = H * 0.68;
  const imgX = W * 0.06;
  const imgY = (H - imgH) / 2;

  const patternCols = 18;
  const patternRows = 14;
  const cell = Math.min(imgW / patternCols, imgH / patternRows);
  const patX = W - imgX - patternCols * cell;
  const patY = imgY + (imgH - patternRows * cell) / 2;

  // Phase 0: Source image builds up (pixel gradient heart)
  // Phase 1: Image pixelates + converts to bead pattern
  // Phase 2: Pattern sits with BOM info

  // Draw source image frame
  const imgAlpha = p < 0.2 ? p * 5 : 1;
  ctx.globalAlpha = imgAlpha;
  ctx.strokeStyle = 'rgba(88, 166, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(imgX, imgY, imgW, imgH);

  // Source: gradient image (heart shape, soft)
  const px = Math.ceil(imgW / 28);
  const cols = Math.floor(imgW / px);
  const rows = Math.floor(imgH / px);
  const revealPx = Math.floor(cols * rows * Math.min(1, p * 1.2));
  let idx = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (idx > revealPx) break;
      const dx = x - cols / 2 + 0.5;
      const dy = y - rows / 2 + 0.5;
      const hx = dx / (cols * 0.4);
      const hy = -dy / (rows * 0.42);
      const heart = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
      if (heart < 0) {
        // Gradient: dark center to light edges (simulating a photo)
        const dist = Math.sqrt(dx*dx + dy*dy) / (cols * 0.4);
        const shade = Math.floor(180 - dist * 60);
        ctx.fillStyle = `rgb(${shade + 30}, ${Math.floor(shade * 0.4)}, ${Math.floor(shade * 0.5)})`;
      } else {
        // Background: soft gray
        ctx.fillStyle = '#2a3038';
      }
      ctx.fillRect(imgX + x * px, imgY + y * px, px - 1, px - 1);
      idx++;
    }
  }

  // Label: Source
  ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Source Image', imgX + imgW / 2, imgY - 6);
  ctx.globalAlpha = 1;

  // Arrow: convert
  const arrowAlpha = Math.max(0, Math.min(1, (p - 0.15) * 3));
  if (arrowAlpha > 0) {
    ctx.globalAlpha = arrowAlpha;
    const ax = W / 2;
    const ay = H / 2;
    // Arrow body
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax - 18, ay);
    ctx.lineTo(ax + 18, ay);
    ctx.stroke();
    // Arrow head
    ctx.fillStyle = '#58a6ff';
    ctx.beginPath();
    ctx.moveTo(ax + 18, ay);
    ctx.lineTo(ax + 10, ay - 5);
    ctx.lineTo(ax + 10, ay + 5);
    ctx.closePath();
    ctx.fill();
    // Label
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Convert', ax, ay - 10);
    ctx.globalAlpha = 1;
  }

  // Draw bead pattern frame (pegboard)
  const patAlpha = Math.max(0, Math.min(1, (p - 0.3) * 2.5));
  ctx.globalAlpha = patAlpha;

  // Peg board
  const boardPad = cell * 0.4;
  ctx.fillStyle = '#2a2418';
  roundRect(ctx, patX - boardPad, patY - boardPad, patternCols * cell + boardPad * 2, patternRows * cell + boardPad * 2, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 140, 60, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Build heart pattern for beads (0=outline, 1=fill, -1=empty)
  const pattern: number[][] = [];
  for (let y = 0; y < patternRows; y++) {
    pattern[y] = [];
    for (let x = 0; x < patternCols; x++) {
      const dx = x - patternCols / 2 + 0.5;
      const dy = y - patternRows / 2 + 0.5;
      const hx = dx / (patternCols * 0.4);
      const hy = -dy / (patternRows * 0.42);
      const h = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
      if (h < 0) {
        pattern[y][x] = h > -0.06 ? 0 : 1;
      } else {
        pattern[y][x] = -1;
      }
    }
  }

  // Count beads and their positions for animation
  const beadPositions: { x: number; y: number; ci: number }[] = [];
  for (let y = 0; y < patternRows; y++) {
    for (let x = 0; x < patternCols; x++) {
      if (pattern[y][x] >= 0) {
        beadPositions.push({ x, y, ci: pattern[y][x] });
      }
    }
  }

  // Empty pegs first
  for (let y = 0; y < patternRows; y++) {
    for (let x = 0; x < patternCols; x++) {
      const cx = patX + (x + 0.5) * cell;
      const cy = patY + (y + 0.5) * cell;
      ctx.fillStyle = 'rgba(120, 100, 60, 0.28)';
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = BG;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Beads appear one by one
  const beadColors = ['#E91E63', '#FF80AB'];
  const revealP = Math.max(0, Math.min(1, (p - 0.4) * 2));
  const revealBeads = Math.floor(ease(revealP) * beadPositions.length);

  for (let i = 0; i < beadPositions.length; i++) {
    if (i >= revealBeads) break;
    const bp = beadPositions[i];
    const cx = patX + (bp.x + 0.5) * cell;
    const cy = patY + (bp.y + 0.5) * cell;
    const color = beadColors[bp.ci];

    // Glow on last bead
    if (i === revealBeads - 1) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
    }
    // 3D bead
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
    if (i === revealBeads - 1) ctx.restore();
  }

  // Color code labels on the pattern (a few key beads)
  if (revealP > 0.6) {
    ctx.globalAlpha = Math.min(1, (revealP - 0.6) * 3);
    ctx.font = `bold ${Math.max(7, cell * 0.28)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Top center bead
    const labelPositions = beadPositions.filter((_, i) => i % 12 === 0).slice(0, 4);
    for (const bp of labelPositions) {
      const cx = patX + (bp.x + 0.5) * cell;
      const cy = patY + (bp.y + 0.5) * cell;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillText(beadColors[bp.ci] === beadColors[0] ? 'A1' : 'A3', cx, cy);
    }
    ctx.globalAlpha = 1;
  }

  // Label: Bead Pattern
  ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Bead Pattern', patX + (patternCols * cell) / 2, patY - 6);

  // Bottom info bar: bead count + colors
  if (p > 0.75) {
    const infoAlpha = Math.min(1, (p - 0.75) * 4);
    ctx.globalAlpha = infoAlpha;
    const barY = patY + patternRows * cell + 12;
    // Colors used
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${beadColors.length} colors`, patX, barY + 8);
    // Total count
    ctx.textAlign = 'right';
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 11px monospace';
    const shownCount = Math.floor(beadPositions.length * Math.min(1, infoAlpha));
    ctx.fillText(`${shownCount} beads`, patX + patternCols * cell, barY + 8);
    ctx.globalAlpha = 1;
  }

  ctx.globalAlpha = 1;
}
"""

content = content[:si] + new_demo + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
