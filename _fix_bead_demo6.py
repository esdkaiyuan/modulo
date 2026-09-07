path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = 'function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {'
si = content.index(old_start)
demos_idx = content.index('const DEMOS = {', si)
end_idx = content.rindex('}', si, demos_idx) + 1

new_demo = r"""function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // Bead pattern platform demo: reference photo -> pixelated -> color-reduced bead pattern
  // Shows the complete conversion pipeline visually.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const T = 4.5;
  const p = (t % T) / T;
  const ep = ease(p);

  // ========== LAYOUT ==========
  // Left: source image area
  // Center: processing stages
  // Right: bead pattern result
  const padX = 16;
  const imgW = W * 0.28;
  const imgH = H * 0.7;
  const imgX = padX;
  const imgY = (H - imgH) / 2;

  const patternCols = 22;
  const patternRows = 16;
  const cell = Math.min(imgW / patternCols, imgH / patternRows);
  const patW = patternCols * cell;
  const patH = patternRows * cell;
  const patX = W - padX - patW;
  const patY = (H - patH) / 2;

  // ========== HEART SHAPE DATA ==========
  // Build a heart pattern at pattern resolution (0=empty, 1=fill pink, 2=outline red, 3=dark red shadow)
  function heartVal(x: number, y: number, cols: number, rows: number): number {
    const dx = (x - cols / 2 + 0.5) / (cols * 0.38);
    const dy = -(y - rows / 2 + 0.5) / (rows * 0.4);
    const h = dx*dx + dy*dy - 1;
    const val = h*h*h - dx*dx * dy*dy*dy;
    if (val > 0) return 0; // empty
    // depth: closer to center = darker
    const depth = Math.abs(val);
    if (depth < 0.04) return 2; // outline
    if (depth < 0.2) return 1;  // main
    return 3; // dark shadow
  }

  // ========== PHASE 1: Source image ==========
  const imgPhase = Math.min(1, p * 3);
  if (imgPhase > 0) {
    ctx.globalAlpha = Math.min(1, imgPhase * 2);
    // Image frame
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(imgX, imgY, imgW, imgH);

    // Render a "photo" of a heart at high resolution with soft gradients
    const photoCols = Math.floor(imgW / 2);
    const photoRows = Math.floor(imgH / 2);
    const px = imgW / photoCols;
    const py = imgH / photoRows;
    const photoReveal = Math.min(1, imgPhase);
    const revealRows = Math.floor(photoRows * photoReveal);

    for (let y = 0; y < photoRows; y++) {
      if (y >= revealRows) break;
      for (let x = 0; x < photoCols; x++) {
        const v = heartVal(x, y, photoCols, photoRows);
        if (v === 0) {
          // background: soft blue-gray
          ctx.fillStyle = '#1e2530';
        } else if (v === 2) {
          // outline: bright red edge
          ctx.fillStyle = '#ff4060';
        } else if (v === 1) {
          // main: gradient red-pink
          const nx = x / photoCols;
          const shade = 0.6 + nx * 0.4;
          ctx.fillStyle = `rgb(${Math.floor(255 * shade)}, ${Math.floor(80 * shade)}, ${Math.floor(130 * shade)})`;
        } else {
          // shadow: dark red
          ctx.fillStyle = '#8b1030';
        }
        ctx.fillRect(imgX + x * px, imgY + y * py, px + 0.5, py + 0.5);
      }
    }
    // Label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Source', imgX + imgW / 2, imgY - 6);
    ctx.globalAlpha = 1;
  }

  // ========== PHASE 2: Conversion pipeline ==========
  // Show pixelation + color reduction as stages
  if (p > 0.2) {
    const pipeAlpha = Math.min(1, (p - 0.2) * 2.5);
    ctx.globalAlpha = pipeAlpha;

    const cx = W / 2;

    // Pixelation icon: grid overlay
    const gridSize = 22;
    const gy = H / 2 - gridSize;
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.5)';
    ctx.lineWidth = 1;
    // Grid
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - gridSize / 2 + (i / 4) * gridSize, gy);
      ctx.lineTo(cx - gridSize / 2 + (i / 4) * gridSize, gy + gridSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - gridSize / 2, gy + (i / 4) * gridSize);
      ctx.lineTo(cx + gridSize / 2, gy + (i / 4) * gridSize);
      ctx.stroke();
    }
    // Heart inside grid (small)
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const v = heartVal(x - 0.5, y - 0.5, 3, 3);
        if (v > 0) continue;
        ctx.fillStyle = '#E91E63';
        ctx.fillRect(
          cx - gridSize / 2 + (x / 4) * gridSize + 1,
          gy + (y / 4) * gridSize + 1,
          gridSize / 4 - 2,
          gridSize / 4 - 2
        );
      }
    }

    // Arrow 1 (left to grid)
    const arr1x = cx - gridSize / 2 - 18;
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(arr1x, H / 2 - 8);
    ctx.lineTo(cx - gridSize / 2 - 2, H / 2 - 8);
    ctx.stroke();
    ctx.fillStyle = '#58a6ff';
    ctx.beginPath();
    ctx.moveTo(cx - gridSize / 2 - 2, H / 2 - 8);
    ctx.lineTo(cx - gridSize / 2 - 7, H / 2 - 11);
    ctx.lineTo(cx - gridSize / 2 - 7, H / 2 - 5);
    ctx.closePath();
    ctx.fill();

    // Arrow 2 (grid to pattern)
    const arr2x = cx + gridSize / 2 + 2;
    ctx.beginPath();
    ctx.moveTo(arr2x, H / 2 - 8);
    ctx.lineTo(arr2x + 16, H / 2 - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(arr2x + 16, H / 2 - 8);
    ctx.lineTo(arr2x + 11, H / 2 - 11);
    ctx.lineTo(arr2x + 11, H / 2 - 5);
    ctx.closePath();
    ctx.fill();

    // Step labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pixelate', cx, gy + gridSize + 10);

    ctx.globalAlpha = 1;
  }

  // ========== PHASE 3: Bead pattern result ==========
  if (p > 0.35) {
    const patAlpha = Math.min(1, (p - 0.35) * 2.2);
    ctx.globalAlpha = patAlpha;

    // Peg board background
    const boardPad = cell * 0.5;
    ctx.fillStyle = '#f0e8d0';
    roundRect(ctx, patX - boardPad, patY - boardPad, patW + boardPad * 2, patH + boardPad * 2, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 70, 30, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Empty pegs
    for (let y = 0; y < patternRows; y++) {
      for (let x = 0; x < patternCols; x++) {
        const cx = patX + (x + 0.5) * cell;
        const cy = patY + (y + 0.5) * cell;
        ctx.fillStyle = 'rgba(160, 130, 70, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffbe8';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Color palette (MARD-style: A=reds, H=black)
    const palette = [
      { code: 'A1', hex: '#C62828' }, // deep red outline
      { code: 'A3', hex: '#FF80AB' }, // pink
      { code: 'H10', hex: '#212121' }, // black (not used here, in legend)
    ];

    // Place beads with animation (fill row by row)
    const totalBeads = patternCols * patternRows;
    const revealProgress = Math.min(1, patAlpha);
    const revealAmt = Math.floor(ease(revealProgress) * patternRows);

    let lastBead: { x: number; y: number; ci: number } | null = null;
    for (let y = 0; y < patternRows; y++) {
      if (y >= revealAmt) break;
      for (let x = 0; x < patternCols; x++) {
        const v = heartVal(x, y, patternCols, patternRows);
        if (v === 0) continue;
        const ci = v === 2 ? 0 : v === 1 ? 1 : 0; // outline=A1, fill=A3
        const cx = patX + (x + 0.5) * cell;
        const cy = patY + (y + 0.5) * cell;
        const color = palette[ci].hex;

        // 3D bead
        const grd = ctx.createRadialGradient(
          cx - cell * 0.1, cy - cell * 0.1, cell * 0.08,
          cx, cy, cell * 0.4
        );
        grd.addColorStop(0, lightenColor(color, 0.4));
        grd.addColorStop(1, color);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Hole
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.12, 0, Math.PI * 2);
        ctx.fill();

        lastBead = { x, y, ci };
      }
    }

    // Glow on last placed bead
    if (lastBead && revealProgress < 1) {
      const lx = patX + (lastBead.x + 0.5) * cell;
      const ly = patY + (lastBead.y + 0.5) * cell;
      ctx.save();
      ctx.shadowColor = palette[lastBead.ci].hex;
      ctx.shadowBlur = 10;
      ctx.fillStyle = palette[lastBead.ci].hex;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(lx, ly, cell * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Color code labels (every 6th bead in the first row)
    if (revealProgress > 0.7) {
      ctx.globalAlpha = Math.min(1, (revealProgress - 0.7) * 3);
      ctx.font = `bold ${Math.max(7, cell * 0.24)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Outline bead label
      const labelPoints = [
        { x: Math.floor(patternCols / 2), y: 3 },
        { x: Math.floor(patternCols / 2) + 3, y: 7 },
      ];
      for (const lp of labelPoints) {
        const v = heartVal(lp.x, lp.y, patternCols, patternRows);
        if (v === 0) continue;
        const cx = patX + (lp.x + 0.5) * cell;
        const cy = patY + (lp.y + 0.5) * cell;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillText(v === 2 ? 'A1' : 'A3', cx, cy);
      }
      ctx.globalAlpha = 1;
    }

    // Label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bead Pattern', patX + patW / 2, patY - 6);

    // Bottom legend: colors used
    if (revealProgress > 0.8) {
      ctx.globalAlpha = Math.min(1, (revealProgress - 0.8) * 4);
      const ly = patY + patH + 10;
      // Count colors
      const counts: number[] = [0, 0];
      for (let y = 0; y < patternRows; y++) {
        for (let x = 0; x < patternCols; x++) {
          const v = heartVal(x, y, patternCols, patternRows);
          if (v === 2) counts[0]++;
          else if (v === 1) counts[1]++;
        }
      }

      ctx.textAlign = 'left';
      ctx.font = '8px monospace';
      for (let i = 0; i < 2; i++) {
        const lx = patX + i * 52;
        // Swatch
        ctx.fillStyle = palette[i].hex;
        ctx.beginPath();
        ctx.arc(lx + 4, ly, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Code
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(palette[i].code, lx + 12, ly + 2);
        // Count
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        const shown = Math.floor(counts[i] * Math.min(1, revealProgress));
        ctx.fillText('x' + shown, lx + 34, ly + 2);
      }

      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = 1;
  }
}
"""

content = content[:si] + new_demo + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
