import re

def check_destructive_operations():
    """檢查破壞性操作"""
    with open('migration_diff.sql', 'r', encoding='utf-16') as f:
        content = f.read()
    
    print("檢查破壞性操作：")
    print("=" * 60)
    
    lines = content.split('\n')
    destructive_lines = []
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(op in line_lower for op in ['drop table', 'alter table', 'redefinetables', 'insert into', 'update']):
            destructive_lines.append((i+1, line.strip()))
    
    print(f"找到 {len(destructive_lines)} 個破壞性操作：")
    for line_num, line_text in destructive_lines:
        print(f"{line_num:4}: {line_text}")
    
    # 檢查具體的表格操作
    print("\n分析具體操作：")
    
    # 檢查 DROP TABLE
    drop_tables = re.findall(r'DROP\s+TABLE\s+"([^"]+)"', content, re.IGNORECASE)
    if drop_tables:
        print(f"DROP TABLE 操作：")
        for table in drop_tables:
            print(f"  - {table}")
    
    # 檢查 ALTER TABLE
    alter_tables = re.findall(r'ALTER\s+TABLE\s+"([^"]+)"', content, re.IGNORECASE)
    if alter_tables:
        print(f"ALTER TABLE 操作：")
        for table in alter_tables:
            print(f"  - {table}")
    
    # 檢查 RedefineTables
    if 'RedefineTables' in content:
        print("找到 RedefineTables 操作（表格重建）")
    
    # 檢查 INSERT 和 UPDATE
    insert_tables = re.findall(r'INSERT\s+INTO\s+"([^"]+)"', content, re.IGNORECASE)
    if insert_tables:
        print(f"INSERT INTO 操作：")
        for table in insert_tables:
            print(f"  - {table}")
    
    update_tables = re.findall(r'UPDATE\s+"([^"]+)"', content, re.IGNORECASE)
    if update_tables:
        print(f"UPDATE 操作：")
        for table in update_tables:
            print(f"  - {table}")

if __name__ == "__main__":
    check_destructive_operations()