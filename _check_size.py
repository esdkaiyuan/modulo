path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the whole demoBeadPattern function
si = content.index('function demoBeadPattern(ctx: CanvasRenderingContext2D, t: number) {')
demos_idx = content.index('const DEMOS = {', si)
end_idx = content.rindex('}', si, demos_idx) + 1

func_text = content[si:end_idx]
print(f'Function length: {len(func_text)}')
print('First 300 chars:')
print(func_text[:300])
print('...')
print('Last 200 chars:')
print(func_text[-200:])
