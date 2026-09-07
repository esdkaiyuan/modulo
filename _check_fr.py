import re

path = r'C:\Users\28916\.config\superpowers\worktrees\modulo\mysql-account-backend\server\dist\modules\fileRecords\fileRecordRepository.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The issue: backtick template strings lost their backticks
# Let's check what's broken
print('Has backtick SQL:', content.count('SELECT') >= 1)
print('Has broken SQL:', 'SELECT,' in content[:500])

# Find all broken SQL patterns - they look like: query(runner, SELECT, ...)
# These should be: query(runner, SELECT ...)
# But the backticks got lost

# Let's check file length and structure
lines = content.split('\n')
print(f'Total lines: {len(lines)}')
for i, line in enumerate(lines[:20]):
    print(f'{i+1}: {line[:100]}')