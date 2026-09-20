import re

print("SQL DIFFERENCE ANALYSIS")
print("=" * 60)

# 讀取修復後的差異
with open('migration_diff_after_repair.sql', 'r', encoding='utf-8') as f:
    content = f.read()

print("1. SQL 操作統計:")
print("-" * 40)

# 計算各種操作
create_table = len(re.findall(r'CREATE TABLE', content, re.IGNORECASE))
create_index = len(re.findall(r'CREATE (UNIQUE )?INDEX', content, re.IGNORECASE))
drop_table = len(re.findall(r'DROP TABLE', content, re.IGNORECASE))
alter_table = len(re.findall(r'ALTER TABLE', content, re.IGNORECASE))
redefine = len(re.findall(r'RedefineTables', content, re.IGNORECASE))

print(f"CREATE TABLE = {create_table}")
print(f"CREATE UNIQUE INDEX = {create_index}")
print(f"DROP TABLE = {drop_table}")
print(f"ALTER TABLE = {alter_table}")
print(f"REDEFINE = {redefine}")

print(f"\n2. 現有表格影響分析:")
print("-" * 40)

existing_tables_touched = drop_table > 0 or alter_table > 0 or redefine > 0
print(f"Existing 22 tables touched = {'YES' if existing_tables_touched else 'NO'}")

if existing_tables_touched:
    print("警告: 差異包含破壞性操作!")
else:
    print("良好: 差異不包含破壞性操作")

print(f"\n3. 增量差異評估:")
print("-" * 40)

additive_diff = create_table > 0 and drop_table == 0 and alter_table == 0 and redefine == 0
print(f"ADDITIVE_DIFF = {'YES' if additive_diff else 'NO'}")

if additive_diff:
    print("良好: 這是純增量差異")
    print(f"將新增 {create_table} 個新表格")
else:
    print("警告: 這不是純增量差異")

print(f"\n4. 詳細表格列表:")
print("-" * 40)

# 提取所有創建的表格名稱
table_pattern = r'CREATE TABLE "([^"]+)"'
tables = re.findall(table_pattern, content)

if tables:
    print(f"將創建 {len(tables)} 個新表格:")
    for i, table in enumerate(tables, 1):
        print(f"  {i:2}. {table}")
else:
    print("沒有新表格創建")

print(f"\n5. squads 重新定義狀態:")
print("-" * 40)

# 檢查是否還有 squads 重新定義
squads_redefine = 'squads' in content and ('DROP TABLE' in content or 'ALTER TABLE' in content)
print(f"Squads redefine remains = {'YES' if squads_redefine else 'NO'}")

if squads_redefine:
    print("警告: squads 表格仍然需要重新定義")
    # 查找原因
    if 'ON UPDATE CASCADE' in content:
        print("原因: ON UPDATE CASCADE 約束不一致")
else:
    print("良好: squads 表格不需要重新定義")