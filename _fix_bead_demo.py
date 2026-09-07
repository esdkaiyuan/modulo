path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the old demoBeadPattern function and replace it
old_start = 'function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {'
old_end = '}\n\nconst DEMOS = {'

si = content.index(old_start)
ei = content.index(old_end, si) + 1

new_demo = r"""function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // Bead pattern demo: heart shape fills in row by row,
  // with color-code labels, peg board grid, and a mini legend.
  const BEAD_COLORS = [
    { hex: '#E91E63', code: 'A1', name: 'Red' },
    { hex: '#FF80AB', code: 'A3', name: 'Pink' },
    { hex: '#FFD54F', code: 'H1', name: 'Yellow' },
    { hex: '#FFFFFF', code: 'H18', name: 'White' },
    { hex: '#212121', code: 'H10', name: 'Black' },
    { hex: '#64B5F6', code: 'C6', name: 'Blue' },
  ];
  const GRID_COLS = 17;
  const GRID_ROWS = 15;
  const cell = Math.min((W - 140) / GRID_COLS, (CH - 20) / GRID_ROWS);
  const startX = (W - GRID_COLS * cell) / 2 - 50;
  const startY = (H - GRID_ROWS * cell) / 2;

  // Heart pattern (2 = red outline, 1 = pink fill, 0 = empty)
  const heart = [
    [0,0,2,2,0,0,0,2,2,0,0,0,2,2,0,0,0],
    [0,2,2,1,2,0,2,1,1,2,0,2,1,1,2,0,0],
    [2,2,1,1,1,2,1,1,1,1,2,1,1,1,1,2,0],
    [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
    [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,0],
    [2,2,1,1,1,1,1,1,1,1,1,1,1,1,2,0,0],
    [0,2,2,1,1,1,1,1,1,1,1,1,1,2,0,0,0],
    [0,0,2,2,1,1,1,1,1,1,1,1,2,0,0,0,0],
    [0,0,0,2,2,1,1,1,1,1,1,2,0,0,0,0,0],
    [0,0,0,0,2,2,1,1,1,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ];
  const colorMap: Record<number, number> = { 2: 0, 1: 1 }; // outline=red, fill=pink

  const T = 5.0;
  const p = (t % T) / T;
  const totalRows = GRID_ROWS;
  const revealRow = Math.floor(p * (totalRows + 4));

  // Draw peg board background
  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(startX - 6, startY - 6, GRID_COLS * cell + 12, GRID_ROWS * cell + 12);

  // Draw peg grid (empty pegs)
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const cx = startX + x * cell + cell / 2;
      const cy = startY + y * cell + cell / 2;
      ctx.fillStyle = 'rgba(158, 158, 158, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // Small hole in middle
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw placed beads row by row with animation
  let placedCount = 0;
  for (let y = 0; y < GRID_ROWS; y++) {
    if (y > revealRow) break;
    for (let x = 0; x < GRID_COLS; x++) {
      const val = heart[y][x];
      if (val === 0) continue;
      const ci = colorMap[val] ?? 0;
      const cx = startX + x * cell + cell / 2;
      const cy = startY + y * cell + cell / 2;
      const isLast = (y === revealRow);

      // Bead body with 3D effect
      const grd = ctx.createRadialGradient(cx - cell * 0.1, cy - cell * 0.1, cell * 0.1, cx, cy, cell * 0.4);
      grd.addColorStop(0, lightenColor(BEAD_COLORS[ci].hex, 0.3));
      grd.addColorStop(1, BEAD_COLORS[ci].hex);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Bead hole
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.13, 0, Math.PI * 2);
      ctx.fill();

      // Color code label on every 5th bead
      if (y === Math.min(revealRow, GRID_ROWS - 1) && x > 0 && heart[y][x] !== 0 && x % 4 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.font = `bold ${Math.max(8, cell * 0.28)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(BEAD_COLORS[ci].code, cx, cy);
      }

      placedCount++;
    }
  }

  // Board border
  ctx.strokeStyle = 'rgba(33, 33, 33, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX - 6, startY - 6, GRID_COLS * cell + 12, GRID_ROWS * cell + 12);

  // Legend panel on the right
  const legX = startX + GRID_COLS * cell + 20;
  const legW = 100;
  const legH = 80;
  const legY = startY + 5;

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  roundRect(ctx, legX, legY, legW, legH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('BOM', legX + 8, legY + 6);

  // Legend items
  const legendItems = [
    { ci: 0, label: 'A1  Red', count: Math.floor(placedCount * 0.35) },
    { ci: 1, label: 'A3  Pink', count: Math.floor(placedCount * 0.65) },
  ];
  legendItems.forEach((item, i) => {
    const ly = legY + 22 + i * 18;
    // Bead swatch
    ctx.fillStyle = BEAD_COLORS[item.ci].hex;
    ctx.beginPath();
    ctx.arc(legX + 14, ly + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(legX + 14, ly + 5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Label
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = '9px monospace';
    ctx.fillText(item.label, legX + 24, ly);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(`\u00d7 ${item.count}`, legX + 24, ly + 10);
  });
}
"""

content = content[:si] + new_demo + content[ei:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Bead demo replaced')
