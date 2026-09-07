path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = 'function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {'
# Find the end - look for closing brace + empty lines + const DEMOS
si = content.index(old_start)
# Find "} \n\n\nconst DEMOS" or similar pattern
import re
# Find the function end by finding where DEMOS starts after si
demos_idx = content.index('const DEMOS = {', si)
# Go back to find the closing brace
end_idx = content.rindex('}', si, demos_idx) + 1

new_demo = r"""function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // Bead pattern platform demo: shows image -> pixelate -> bead grid -> BOM flow
  const phase = Math.floor(t / 2.5) % 3;
  const p = (t % 2.5) / 2.5;

  // Dark background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // Subtle dot grid background
  ctx.fillStyle = 'rgba(88, 166, 255, 0.05)';
  for (let y = 6; y < H; y += 10) {
    for (let x = 6; x < W; x += 10) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  if (phase === 0) {
    // Phase 1: Source image (pixelated heart) scanning in
    const imgW = 90, imgH = 68;
    const ix = Math.floor((W - imgW) / 2 - 50);
    const iy = Math.floor((H - imgH) / 2);
    const alpha = Math.min(1, p * 2);
    ctx.globalAlpha = alpha;

    // Image frame with scan line
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ix, iy, imgW, imgH);

    // Pixel heart fills left to right
    const pxSize = 4;
    const cols = Math.floor(imgW / pxSize);
    const rows = Math.floor(imgH / pxSize);
    const reveal = Math.floor(cols * Math.min(1, p * 1.8));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < Math.min(cols, reveal); x++) {
        const dx = x - cols / 2 + 0.5;
        const dy = y - rows / 2 + 0.5;
        const hx = dx / (cols * 0.42);
        const hy = -dy / (rows * 0.42);
        const heart = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
        if (heart < 0) {
          const isOutline = heart > -0.06;
          ctx.fillStyle = isOutline ? '#E91E63' : '#FF80AB';
          ctx.fillRect(ix + x * pxSize, iy + y * pxSize, pxSize, pxSize);
        }
      }
    }

    // Scan line
    const scanX = ix + reveal * pxSize;
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scanX, iy);
    ctx.lineTo(scanX, iy + imgH);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Source Image', ix + imgW / 2, iy - 6);

    // Arrow to right
    ctx.globalAlpha = alpha * Math.min(1, (p - 0.5) * 3);
    const ax = ix + imgW + 8, ay = H / 2;
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + 18, ay);
    ctx.lineTo(ax + 13, ay - 4);
    ctx.moveTo(ax + 18, ay);
    ctx.lineTo(ax + 13, ay + 4);
    ctx.stroke();

  } else if (phase === 1) {
    // Phase 2: Bead pegboard with pattern filling
    const COLS = 16, ROWS = 14;
    const cell = Math.min((W - 120) / COLS, (H - 20) / ROWS);
    const sx = Math.floor((W - COLS * cell) / 2 - 40);
    const sy = Math.floor((H - ROWS * cell) / 2);

    // Peg board
    ctx.fillStyle = '#f0ead8';
    roundRect(ctx, sx - 5, sy - 5, COLS * cell + 10, ROWS * cell + 10, 4);
    ctx.fill();

    // Empty pegs
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cx = sx + x * cell + cell / 2;
        const cy = sy + y * cell + cell / 2;
        ctx.fillStyle = 'rgba(180, 160, 120, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Beads fill row by row
    const total = ROWS;
    const revealRow = Math.floor(total * Math.min(1, p * 1.5));
    for (let y = 0; y < ROWS; y++) {
      if (y > revealRow) break;
      for (let x = 0; x < COLS; x++) {
        const dx = x - COLS / 2 + 0.5;
        const dy = y - ROWS / 2 + 0.5;
        const hx = dx / (COLS * 0.4);
        const hy = -dy / (ROWS * 0.4);
        const heart = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
        if (heart < 0) {
          const isOutline = heart > -0.07;
          const cx = sx + x * cell + cell / 2;
          const cy = sy + y * cell + cell / 2;
          const color = isOutline ? '#E91E63' : '#FF80AB';
          // 3D bead
          const grd = ctx.createRadialGradient(cx - cell*0.08, cy - cell*0.08, cell*0.08, cx, cy, cell*0.38);
          grd.addColorStop(0, lightenColor(color, 0.3));
          grd.addColorStop(1, color);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.36, 0, Math.PI * 2);
          ctx.fill();
          // Hole
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.11, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Board border
    ctx.strokeStyle = 'rgba(100, 80, 40, 0.35)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, sx - 5, sy - 5, COLS * cell + 10, ROWS * cell + 10, 4);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bead Pattern', sx + (COLS * cell) / 2, sy - 8);

  } else {
    // Phase 3: BOM list + small preview
    // BOM panel on left
    const bx = 12, by = 12;
    const bw = 100, bh = H - 24;

    ctx.fillStyle = '#161b22';
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#c9d1d9';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BOM / Materials', bx + 8, by + 14);
    ctx.fillStyle = '#30363d';
    ctx.fillRect(bx + 6, by + 19, bw - 12, 1);

    // Material items
    const items = [
      { code: 'A1', name: 'Red', hex: '#E91E63', count: 42 },
      { code: 'A3', name: 'Pink', hex: '#FF80AB', count: 86 },
      { code: 'H1', name: 'Yellow', hex: '#FFD54F', count: 14 },
      { code: 'C6', name: 'Blue', hex: '#64B5F6', count: 0 },
      { code: 'H10', name: 'Black', hex: '#303030', count: 0 },
    ];

    const nItems = Math.min(items.length, Math.floor(p * 1.4 * items.length) + 1);
    for (let i = 0; i < items.length; i++) {
      const iy = by + 28 + i * 20;
      const visible = i < nItems;
      const cntAlpha = visible ? Math.min(1, (p * 1.4 * items.length - i) * 2.5) : 0;

      ctx.globalAlpha = visible ? 1 : 0.2;
      // Bead dot
      ctx.fillStyle = items[i].hex;
      ctx.beginPath();
      ctx.arc(bx + 13, iy + 1, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(bx + 13, iy + 1, 1.4, 0, Math.PI * 2);
      ctx.fill();
      // Code + name
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '9px monospace';
      ctx.fillText(items[i].code, bx + 23, iy - 1);
      ctx.fillStyle = '#8b949e';
      ctx.font = '8px sans-serif';
      ctx.fillText(items[i].name, bx + 23, iy + 8);
      // Count
      ctx.globalAlpha = cntAlpha;
      ctx.fillStyle = '#58a6ff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      const show = Math.floor(items[i].count * Math.min(1, cntAlpha));
      ctx.fillText('x' + show, bx + bw - 8, iy + 1);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    // Total row
    const totalAlpha = Math.min(1, (p - 0.6) * 3);
    ctx.globalAlpha = totalAlpha;
    ctx.fillStyle = '#21262d';
    ctx.fillRect(bx + 4, by + bh - 22, bw - 8, 1);
    ctx.fillStyle = '#8b949e';
    ctx.font = '9px sans-serif';
    ctx.fillText('Total beads', bx + 8, by + bh - 10);
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    const totalCount = 142;
    ctx.fillText(String(Math.floor(totalCount * Math.min(1, (p - 0.6) * 3))), bx + bw - 8, by + bh - 10);
    ctx.globalAlpha = 1;

    // Small bead preview on right
    const pbx = bx + bw + 10;
    const pbw = W - pbx - 10;
    const PCOLS = 16, PROWS = 14;
    const cell = Math.min(pbw / PCOLS, (bh - 8) / PROWS);
    const psx = pbx + (pbw - PCOLS * cell) / 2;
    const psy = by + 4 + ((bh - 8) - PROWS * cell) / 2;

    // Tiny board
    ctx.fillStyle = '#f0ead8';
    roundRect(ctx, psx - 3, psy - 3, PCOLS * cell + 6, PROWS * cell + 6, 3);
    ctx.fill();

    for (let y = 0; y < PROWS; y++) {
      for (let x = 0; x < PCOLS; x++) {
        const dx = x - PCOLS / 2 + 0.5;
        const dy = y - PROWS / 2 + 0.5;
        const hx = dx / (PCOLS * 0.4);
        const hy = -dy / (PROWS * 0.4);
        const heart = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
        const cx = psx + x * cell + cell / 2;
        const cy = psy + y * cell + cell / 2;
        if (heart < 0) {
          const isOutline = heart > -0.07;
          ctx.fillStyle = isOutline ? '#E91E63' : '#FF80AB';
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.36, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(180, 160, 120, 0.25)';
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  ctx.globalAlpha = 1;
}
"""

content = content[:si] + new_demo + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'Replaced {len(new_demo)} chars')
