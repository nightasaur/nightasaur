import os
import re

# 讀取檔案
schema_path = 'prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Before repair:")
print("-" * 40)

# 顯示相關行數
lines = content.split('\n')
for i in range(100, 115):
    if i <= len(lines):
        print(f'{i:3}: {lines[i-1]}')

print("\n" + "=" * 60)

# 替換
old_text = 'name      String        @default("????蹎抆??")'
new_text = 'name      String        @default("我的小隊")'

if old_text in content:
    print(f"Found: {old_text}")
    content = content.replace(old_text, new_text)
    print(f"Replaced with: {new_text}")
    
    # 寫回檔案
    with open(schema_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("File updated successfully")
    
    print("\nAfter repair:")
    print("-" * 40)
    
    # 重新讀取並顯示
    with open(schema_path, 'r', encoding='utf-8') as f:
        new_content = f.read()
    
    new_lines = new_content.split('\n')
    for i in range(100, 115):
        if i <= len(new_lines):
            print(f'{i:3}: {new_lines[i-1]}')
    
    print("\n✓ SQUAD ENCODING REPAIR COMPLETED")
else:
    print("Old text not found")
    print("Current content around line 106:")
    for i in range(103, 110):
        if i <= len(lines):
            print(f'{i:3}: {lines[i-1]}')