path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the heart function with a smiley face pattern
old_func = r"""  function beadColor(x: number, y: number): number {
    const dx = (x - COLS / 2 + 0.5) / (COLS * 0.32);
    const dy = -(y - ROWS / 2 + 0.5) / (ROWS * 0.36);
    const h = dx*dx + dy*dy - 1;
    const val = h*h*h - dx*dx * dy*dy*dy;
    if (val > 0) return 0; // empty
    if (val > -0.04) return 1; // outline
    return 2; // fill
  }"""

new_func = r"""  function beadColor(x: number, y: number): number {
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

# Also update colors: yellow instead of red/pink
old_colors = r"""  const RED = '#E53935';
  const PINK = '#FF80AB';
  const HOLE = 'rgba(0,0,0,0.35)';"""

new_colors = r"""  const YELLOW = '#FFD600';
  const BLACK = '#212121';
  const HOLE = 'rgba(0,0,0,0.3)';"""

# Update the bead drawing logic
old_draw = r"""        if (v === 0) {
          // Empty peg
          dotAt(ctx, x, y, DIM, 0.2);
        } else {
          const color = v === 1 ? RED : PINK;
          // Bead body
          dotAt(ctx, x, y, color, 0.32 + donePulse);"""

new_draw = r"""        if (v === 0) {
          // Empty peg
          dotAt(ctx, x, y, DIM, 0.2);
        } else {
          const color = v === 3 ? BLACK : YELLOW;
          // Bead body
          dotAt(ctx, x, y, color, 0.32 + donePulse);"""

content = content.replace(old_func, new_func)
content = content.replace(old_colors, new_colors)
content = content.replace(old_draw, new_draw)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
