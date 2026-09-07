path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = 'function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {'
old_end_marker = 'function demoAiAgent'

si = content.index(old_start)
ei = content.index(old_end_marker, si)

new_demo = r"""function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // Bead pattern platform demo: shows image -> pixelate -> bead grid -> BOM flow
  // Dark background, cyan accent, shows the platform workflow visually.
  const phase = Math.floor(t / 2.5) % 3;
  const p = (t % 2.5) / 2.5;

  // Background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // Draw grid dots background
  ctx.fillStyle = 'rgba(88, 166, 255, 0.06)';
  for (let y = 8; y < H - 8; y += 10) {
    for (let x = 8; x < W - 8; x += 10) {
      ctx.fillRect(x, y, 2, 2);
    }
  }

  if (phase === 0) {
    // Phase 1: Source image appears (pixelated heart silhouette)
    const imgW = 80, imgH = 60;
    const ix = 30, iy = (H - imgH) / 2;
    const alpha = Math.min(1, p * 2);
    ctx.globalAlpha = alpha;

    // Image frame
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ix, iy, imgW, imgH);

    // Pixelated heart inside image
    const pxSize = 4;
    const cols = imgW / pxSize, rows = imgH / pxSize;
    const reveal = Math.floor(cols * rows * Math.min(1, p * 2));
    let idx = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (idx > reveal) break;
        const dx = x - cols / 2 + 0.5;
        const dy = y - rows / 2 + 0.5;
        // Heart formula
        const hx = dx / (cols * 0.45);
        const hy = -dy / (rows * 0.45);
        const heart = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
        if (heart < 0) {
          ctx.fillStyle = idx === reveal ? '#ff7ab6' : '#e91e63';
          ctx.fillRect(ix + x * pxSize, iy + y * pxSize, pxSize, pxSize);
        }
        idx++;
      }
    }

    // Arrow pointing right
    ctx.globalAlpha = alpha * Math.min(1, (p - 0.3) * 3);
    const ax = ix + imgW + 10, ay = H / 2;
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + 20, ay);
    ctx.lineTo(ax + 15, ay - 5);
    ctx.moveTo(ax + 20, ay);
    ctx.lineTo(ax + 15, ay + 5);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Source Image', ix + imgW / 2, iy - 6);

  } else if (phase === 1) {
    // Phase 2: Bead grid with colored beads on pegboard
    const COLS = 16, ROWS = 14;
    const cell = Math.min((W - 140) / COLS, (H - 20) / ROWS);
    const sx = 40, sy = (H - ROWS * cell) / 2;

    // Peg board
    ctx.fillStyle = '#f5f0e0';
    const bw = COLS * cell + 10, bh = ROWS * cell + 10;
    roundRect(ctx, sx - 5, sy - 5, bw, bh, 4);
    ctx.fill();

    // Empty pegs
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cx = sx + x * cell + cell / 2;
        const cy = sy + y * cell + cell / 2;
        ctx.fillStyle = 'rgba(180, 160, 120, 0.35)';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Heart pattern beads fill left to right
    const colors = { outline: '#E91E63', fill: '#FF80AB' };
    const totalCells = COLS * ROWS;
    const revealed = Math.floor(totalCells * Math.min(1, p * 1.5));
    let idx = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (idx > revealed) break;
        const dx = x - COLS / 2 + 0.5;
        const dy = y - ROWS / 2 + 0.5;
        const hx = dx / (COLS * 0.42);
        const hy = -dy / (ROWS * 0.42);
        const heart = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
        // outline = heart < 0 AND heart > -0.05 (outer band)
        if (heart < 0) {
          const isOutline = heart > -0.08;
          const cx = sx + x * cell + cell / 2;
          const cy = sy + y * cell + cell / 2;
          const color = isOutline ? colors.outline : colors.fill;
          // Bead
          const grd = ctx.createRadialGradient(cx - cell*0.08, cy - cell*0.08, cell*0.08, cx, cy, cell*0.4);
          grd.addColorStop(0, lightenColor(color, 0.3));
          grd.addColorStop(1, color);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.38, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
        idx++;
      }
    }

    // Label
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bead Pattern', sx + bw / 2, sy - 8);

  } else {
    // Phase 3: BOM / Materials list on right, small bead preview on left
    const bx = 10, by = 15;
    const bw = 90, bh = H - 30;

    // BOM panel
    ctx.fillStyle = '#161b22';
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    // BOM title
    ctx.fillStyle = '#c9d1d9';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Materials', bx + 8, by + 14);

    // BOM items (animate count up)
    const items = [
      { code: 'A1', name: 'Red', hex: '#E91E63', count: 42 },
      { code: 'A3', name: 'Pink', hex: '#FF80AB', count: 86 },
      { code: 'H1', name: 'Yellow', hex: '#FFD54F', count: 0 },
      { code: 'C6', name: 'Blue', hex: '#64B5F6', count: 0 },
      { code: 'H10', name: 'Black', hex: '#303030', count: 0 },
    ];
    const revealItems = Math.min(items.length, Math.floor(p * 1.5 * items.length) + 1);

    for (let i = 0; i < items.length; i++) {
      const iy = by + 28 + i * 22;
      const visible = i < revealItems;
      const countAlpha = visible ? Math.min(1, (p * 1.5 * items.length - i) * 3) : 0;

      // Bead swatch
      ctx.globalAlpha = visible ? 1 : 0;
      ctx.fillStyle = items[i].hex;
      ctx.beginPath();
      ctx.arc(bx + 14, iy + 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(bx + 14, iy + 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Code
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '9px monospace';
      ctx.fillText(items[i].code, bx + 24, iy);
      ctx.fillStyle = '#8b949e';
      ctx.font = '8px sans-serif';
      ctx.fillText(items[i].name, bx + 24, iy + 9);

      // Count
      ctx.globalAlpha = countAlpha;
      ctx.fillStyle = '#58a6ff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      const showCount = Math.floor(items[i].count * Math.min(1, countAlpha));
      ctx.fillText('x' + showCount, bx + bw - 8, iy + 2);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    // Total
    ctx.globalAlpha = Math.min(1, (p - 0.5) * 3);
    ctx.fillStyle = '#30363d';
    ctx.fillRect(bx + 6, by + bh - 20, bw - 12, 1);
    ctx.fillStyle = '#c9d1d9';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Total beads', bx + 8, by + bh - 8);
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    const total = 128;
    ctx.fillText(String(Math.floor(total * Math.min(1, (p - 0.5) * 3))), bx + bw - 8, by + bh - 8);
    ctx.globalAlpha = 1;

    // Small bead preview on the right
    const pbx = bx + bw + 10;
    const pbw = W - pbx - 10;
    const pbh = H - 30;
    const COLS = 14, ROWS = 14;
    const cell = Math.min(pbw / COLS, pbh / ROWS);
    const psx = pbx + (pbw - COLS * cell) / 2;
    const psy = by + (pbh - ROWS * cell) / 2;

    // Tiny bead pattern
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const dx = x - COLS / 2 + 0.5;
        const dy = y - ROWS / 2 + 0.5;
        const hx = dx / (COLS * 0.42);
        const hy = -dy / (ROWS * 0.42);
        const heart = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
        if (heart < 0) {
          const isOutline = heart > -0.08;
          const cx = psx + x * cell + cell / 2;
          const cy = psy + y * cell + cell / 2;
          ctx.fillStyle = isOutline ? '#E91E63' : '#FF80AB';
          ctx.beginPath();
          ctx.arc(cx, cy, cell * 0.38, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  ctx.globalAlpha = 1;
}

"""

content = content[:si] + new_demo + content[ei:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Bead demo fully redesigned')
