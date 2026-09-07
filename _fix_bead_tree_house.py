path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_func = r"""  function beadColor(x: number, y: number): number {
    // Smiley face: 0=empty, 1=outline (yellow border), 2=fill (yellow), 3=features (black)
    const dx = (x - COLS / 2 + 0.5) / (COLS * 0.36);
    const dy = -(y - ROWS / 2 + 0.5) / (ROWS * 0.4);
    const r = Math.sqrt(dx*dx + dy*dy);
    // Face circle
    if (r > 1.05) return 0; // outside face
    if (r > 0.95) return 1; // yellow outline
    // Eyes: two small circles in upper half
    const eyeY = -0.25;
    const eyeDx = 0.35;
    const eyeR = 0.12;
    const leftEye = Math.sqrt((dx + eyeDx)*(dx + eyeDx) + (dy - eyeY)*(dy - eyeY));
    const rightEye = Math.sqrt((dx - eyeDx)*(dx - eyeDx) + (dy - eyeY)*(dy - eyeY));
    if (leftEye < eyeR || rightEye < eyeR) return 3; // black eyes
    // Mouth: smile curve (downward arc in lower half)
    if (dy < -0.2 && dy > -0.55) {
      const mouthY = 0.35; // y position of mouth center (below)
      const mouthDx = dx * 1.5;
      const mouthR = Math.sqrt(mouthDx*mouthDx + (dy + mouthY)*(dy + mouthY));
      if (mouthR > 0.4 && mouthR < 0.5 && dy < -0.1) return 3; // mouth
    }
    return 2; // yellow fill
  }"""

new_func = r"""  function beadColor(x: number, y: number): number {
    // Two shapes side by side: tree (left) and house (right)
    // 0=empty, 1=outline, 2=green/tree, 3=brown/trunk, 4=red/roof, 5=tan/house
    const midX = COLS / 2;
    const dx = x - midX + 0.5;
    const dy = -(y - ROWS / 2 + 0.5); // + up, - down

    if (dx < 0) {
      // LEFT: Tree
      const tx = dx + COLS * 0.18; // tree center
      const treeW = COLS * 0.22;
      const treeH = ROWS * 0.5;
      const nx = tx / treeW;
      const ny = (dy + ROWS * 0.05) / treeH;
      // Tree canopy (triangle-ish, pointed top)
      const canopyWidth = (1 - ny) * 1.1;
      if (ny >= 0 && ny <= 0.9 && Math.abs(nx) < canopyWidth) {
        if (Math.abs(nx) > canopyWidth - 0.12) return 1; // outline
        return 2; // green fill
      }
      // Trunk
      if (ny > 0.8 && ny < 1.2 && Math.abs(tx) < COLS * 0.04) {
        return 3; // brown trunk
      }
      // Ground
      if (Math.abs(dy - (-ROWS * 0.28)) < 0.8 && Math.abs(tx) < treeW * 1.1) {
        return 2; // green ground
      }
      return 0;
    } else {
      // RIGHT: House
      const hx = dx - COLS * 0.18; // house center
      const houseW = COLS * 0.28;
      const houseY = -ROWS * 0.02; // vertical center
      const nx = hx / houseW;
      const ny = (dy - houseY) / (ROWS * 0.3);

      // Roof (triangle on top)
      if (ny > 0.9 && ny < 1.4 && Math.abs(nx) < (1.4 - ny) * 1.1) {
        if (Math.abs(Math.abs(nx) - (1.4 - ny) * 1.1) < 0.12) return 1;
        return 4; // red roof
      }
      // House body
      if (ny >= -0.9 && ny <= 0.9 && Math.abs(nx) < 0.9) {
        if (Math.abs(nx) > 0.78) return 1; // outline
        if (ny < -0.88) return 1; // bottom outline
        // Door (middle bottom)
        if (Math.abs(nx) < 0.2 && ny < -0.3 && ny > -0.9) {
          return 3; // brown door
        }
        // Window (left upper)
        if (nx < -0.35 && nx > -0.65 && ny > 0.1 && ny < 0.5) {
          return 1; // window frame
        }
        return 5; // tan house body
      }
      // Ground line
      if (Math.abs(dy - (-ROWS * 0.28)) < 0.8 && Math.abs(hx) < houseW * 1.2) {
        return 5; // ground same as house
      }
      return 0;
    }
  }"""

# Update colors
old_colors = r"""  const YELLOW = '#FFD600';
  const BLACK = '#212121';
  const HOLE = 'rgba(0,0,0,0.3)';"""

new_colors = r"""  const GREEN = '#4CAF50';
  const BROWN = '#8D6E63';
  const RED = '#E53935';
  const TAN = '#FFCC80';
  const OUTLINE = '#388E3C';
  const HOLE = 'rgba(0,0,0,0.3)';"""

# Update drawing logic
old_draw = r"""        if (v === 0) {
          // Empty peg
          dotAt(ctx, x, y, DIM, 0.2);
        } else {
          const color = v === 3 ? BLACK : YELLOW;
          // Bead body
          dotAt(ctx, x, y, color, 0.32 + donePulse);"""

new_draw = r"""        if (v === 0) {
          // Empty peg
          dotAt(ctx, x, y, DIM, 0.2);
        } else {
          let color = GREEN;
          if (v === 1) color = OUTLINE;
          else if (v === 2) color = GREEN;
          else if (v === 3) color = BROWN;
          else if (v === 4) color = RED;
          else if (v === 5) color = TAN;
          // Bead body
          dotAt(ctx, x, y, color, 0.32 + donePulse);"""

content = content.replace(old_func, new_func)
content = content.replace(old_colors, new_colors)
content = content.replace(old_draw, new_draw)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
