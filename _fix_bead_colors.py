path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_colors = r"""  const GREEN = '#4CAF50';
  const BROWN = '#8D6E63';
  const RED = '#E53935';
  const TAN = '#FFCC80';
  const OUTLINE = '#388E3C';
  const HOLE = 'rgba(0,0,0,0.3)';"""

new_colors = r"""  // MARD-style bead colors
  const DARK_GREEN = '#2E7D32';   // D series: dark green (tree outline)
  const GREEN = '#66BB6A';        // D series: green (tree leaves)
  const BROWN = '#A1887F';        // G series: brown (trunk)
  const DARK_RED = '#C62828';     // A series: dark red (roof outline)
  const RED = '#EF5350';          // A series: red (roof)
  const YELLOW = '#FFF176';       // F series: light yellow (house body)
  const OUTLINE = '#2E7D32';
  const HOLE = 'rgba(0,0,0,0.28)';"""

# Also update the color assignment in the drawing
old_assign = r"""          let color = GREEN;
          if (v === 1) color = OUTLINE;
          else if (v === 2) color = GREEN;
          else if (v === 3) color = BROWN;
          else if (v === 4) color = RED;
          else if (v === 5) color = TAN;"""

new_assign = r"""          let color = GREEN;
          if (v === 1) color = DARK_GREEN;
          else if (v === 2) color = GREEN;
          else if (v === 3) color = BROWN;
          else if (v === 4) color = RED;
          else if (v === 5) color = YELLOW;"""

content = content.replace(old_colors, new_colors)
content = content.replace(old_assign, new_assign)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
