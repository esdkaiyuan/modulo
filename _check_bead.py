path = r'D:\aesdnew\modulo\src\components\ToolDemo.vue'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find end by looking for the function before demoAiAgent
idx1 = content.index('function demoBeadPattern')
# Find the closing pattern: line starting with "const DEMOS" or the next function
idx2 = content.index('const DEMOS = {', idx1)

# Get the function and check what's there
func_text = content[idx1:idx2]
print(f'Function length: {len(func_text)} chars')
print(f'First 200 chars: {func_text[:200]}')
print(f'Last 100 chars: {func_text[-100:]}')
