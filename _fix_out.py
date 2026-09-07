path = r'D:\aesdnew\modulo\src\engines\outputFormatter.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

old = "`// ${COLOR_FORMAT_INFO[format].bytesPerPixel} byte(s)/pixel, byte order: ${format ==="
new = "`// 每像素字节数 / Bytes per pixel: ${COLOR_FORMAT_INFO[format].bytesPerPixel}, 字节序 / Byte order: ${format ==="
if old in content:
    content = content.replace(old, new)
    changes += 1

replacements = [
    ("rgb565: 'RGB565 (16-bit color)',", "rgb565: 'RGB565 16位色 / 16-bit color',"),
    ("rgb888: 'RGB888 (24-bit color, R G B byte order)',", "rgb888: 'RGB888 24位色 / 24-bit color (R G B byte order)',"),
    ("rgb332: 'RGB332 (8-bit color)',", "rgb332: 'RGB332 8位色 / 8-bit color',"),
]
for r_old, r_new in replacements:
    if r_old in content:
        content = content.replace(r_old, r_new)
        changes += 1

print(f'Total changes: {changes}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
