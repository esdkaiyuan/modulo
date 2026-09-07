path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_func_start = '  function beadColor(x: number, y: number): number {'
func_si = content.index(old_func_start)
func_ei_marker = '  const YELLOW ='
# find the color consts section after the function - no wait, colors are BEFORE the function?
# Let's check structure
print('beadColor at:', func_si)
print('function demoBeadPattern starts at:', content.index('function demoBeadPattern'))
