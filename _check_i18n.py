import re

path = r'D:\aesdnew\modulo\src\i18n\messages.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract en keys
en_match = re.search(r'const en = \{(.+?)\n\};', content, re.DOTALL)
zh_match = re.search(r'const zh[^{]+\{(.+?)\n\};', content, re.DOTALL)

if not en_match:
    print('Could not find en object')
    exit(1)

en_text = en_match.group(1)
zh_text = zh_match.group(1) if zh_match else ''

en_keys = re.findall(r"^\s*'([^']+)':", en_text, re.MULTILINE)
zh_keys = re.findall(r"^\s*'([^']+)':", zh_text, re.MULTILINE)

print(f'English keys: {len(en_keys)}')
print(f'Chinese keys: {len(zh_keys)}')

en_set = set(en_keys)
zh_set = set(zh_keys)

missing_zh = sorted(en_set - zh_set)
missing_en = sorted(zh_set - en_set)

if missing_zh:
    print(f'\nMissing in Chinese ({len(missing_zh)}):')
    for k in missing_zh:
        print(f'  {k}')
else:
    print('\nAll English keys present in Chinese ✓')

if missing_en:
    print(f'\nMissing in English ({len(missing_en)}):')
    for k in missing_en:
        print(f'  {k}')
else:
    print('All Chinese keys present in English ✓')