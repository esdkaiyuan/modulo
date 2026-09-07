path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = 'function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {'
si = content.index(old_start)
demos_idx = content.index('const DEMOS = {', si)
end_idx = content.rindex('}', si, demos_idx) + 1

new_demo = r"""function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {
  // Scan line converts a soft gradient scene (tree + house) into
  // color-quantized bead pattern. Full-width, higher detail.
  const T = 4.4;
  const p = (t % T) / T;
  const sweep = ease(p / 0.72) * (COLS + 2) - 1;
  const donePulse = p > 0.78 ? Math.sin(((p - 0.78) / 0.22) * Math.PI) * 0.06 : 0;

  // Scene: tree on left, house on right, grass ground
  // Color codes: 0=empty, 1=dark green outline, 2=green, 3=brown (trunk/door),
  // 4=red (roof), 5=yellow (house body), 6=blue (sky)
  function beadColor(x: number, y: number): number {
    // Ground: bottom 2 rows
    if (y >= ROWS - 2) return 2; // green ground

    // Sky background (light blue dots)
    if (y < 2) return 6; // blue sky top

    // Tree: left side (cols 2-9)
    const treeCx = 6.5;
    const treeTopY = 1;
    const treeBotY = 8;
    const treeW = 4;
    const tx = x - treeCx;
    const ty = y - treeTopY;
    const th = treeBotY - treeTopY;
    const tw = (1 - ty / th) * treeW;

    if (x >= 3 && x <= 10 && y >= treeTopY && y <= treeBotY + 1) {
      if (Math.abs(tx) <= tw) {
        if (Math.abs(tx) >= tw - 0.8) return 1; // outline
        return 2; // green leaves
      }
    }
    // Trunk
    if (x === 6 || x === 7) {
      if (y >= treeBotY - 1 && y <= ROWS - 3) return 3; // brown trunk
    }

    // House: right side (cols 15-26)
    const houseLeft = 15;
    const houseRight = 26;
    const houseCx = (houseLeft + houseRight) / 2;
    const roofTopY = 2;
    const roofBotY = 6;
    const wallTopY = 6;
    const wallBotY = ROWS - 3;

    // Roof (triangle)
    if (y >= roofTopY && y <= roofBotY) {
      const roofRow = y - roofTopY;
      const roofHalf = (roofBotY - roofTopY - roofRow) * 1.2 + 1;
      if (Math.abs(x - houseCx) <= roofHalf) {
        if (Math.abs(Math.abs(x - houseCx) - roofHalf) < 0.7) return 4; // red outline-ish
        return 4; // red roof
      }
    }

    // House walls
    if (y >= wallTopY && y <= wallBotY) {
      if (x >= houseLeft && x <= houseRight) {
        // Door (middle bottom)
        if (Math.abs(x - houseCx) <= 1 && y >= wallBotY - 2) {
          return 3; // brown door
        }
        // Window (left upper)
        if (x >= houseLeft + 2 && x <= houseLeft + 4 && y >= wallTopY + 1 && y <= wallTopY + 3) {
          if (x === houseLeft + 2 || x === houseLeft + 4 || y === wallTopY + 1 || y === wallTopY + 3) {
            return 3; // window frame (brown)
          }
          return 6; // blue window glass
        }
        // Window (right upper)
        if (x >= houseRight - 4 && x <= houseRight - 2 && y >= wallTopY + 1 && y <= wallTopY + 3) {
          if (x === houseRight - 4 || x === houseRight - 2 || y === wallTopY + 1 || y === wallTopY + 3) {
            return 3; // window frame
          }
          return 6; // blue window glass
        }
        // Wall body
        if (x === houseLeft || x === houseRight || y === wallBotY) return 5; // darker outline
        return 5; // yellow house
      }
    }

    // Sky background dots
    return 0;
  }

  const COLORS = [
    'transparent',   // 0 empty
    '#1B5E20',       // 1 dark green outline
    '#4CAF50',       // 2 green (D series)
    '#795548',       // 3 brown (G series)
    '#D32F2F',       // 4 red (A series)
    '#FFEB3B',       // 5 yellow (F series)
    '#64B5F6',       // 6 light blue (C series)
  ];

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const v = beadColor(x, y);
      if (x < sweep) {
        // Converted side: bead dots
        if (v === 0) {
          dotAt(ctx, x, y, DIM, 0.18);
        } else {
          // Bead body
          dotAt(ctx, x, y, COLORS[v], 0.34 + donePulse);
          // Peg hole
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.arc((x + 0.5) * CW, (y + 0.5) * CH, Math.min(CW, CH) * 0.11, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Un-converted side: soft gradient (source photo look)
        if (v === 0) {
          // Sky
          ctx.fillStyle = 'rgba(100, 181, 246, 0.15)';
        } else if (v === 6) {
          // Window blue
          ctx.fillStyle = 'rgba(100, 181, 246, 0.7)';
        } else if (v === 2) {
          // Green gradient
          const dist = Math.abs(x - COLS / 2) / COLS;
          ctx.fillStyle = `rgba(76, 175, 80, ${0.7 + dist * 0.3})`;
        } else if (v === 4) {
          // Red gradient
          ctx.fillStyle = `rgba(211, 47, 47, 0.75)`;
        } else if (v === 5) {
          // Yellow gradient
          ctx.fillStyle = `rgba(255, 235, 59, 0.7)`;
        } else if (v === 3) {
          // Brown
          ctx.fillStyle = `rgba(121, 85, 72, 0.8)`;
        } else {
          // Dark green outline
          ctx.fillStyle = `rgba(27, 94, 32, 0.8)`;
        }
        ctx.fillRect(x * CW + 0.5, y * CH + 0.5, CW - 1, CH - 1);
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
