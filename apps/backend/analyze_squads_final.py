import sqlite3
import os
import re

def analyze_squads_structure():
    """分析 squads 表格結構"""
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("1. ACTUAL SQLITE SQUADS DDL")
    print("=" * 60)
    
    # 1. 獲取實際的 CREATE TABLE 語句
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='squads'")
    create_table_sql = cursor.fetchone()
    
    if create_table_sql:
        print("\nActual SQLite CREATE TABLE squads:")
        print("-" * 40)
        print(create_table_sql[0])
    else:
        print("\nERROR: squads table not found in SQLite")
        conn.close()
        return None
    
    # 2. PRAGMA table_info
    print("\nPRAGMA table_info('squads'):")
    print("-" * 40)
    cursor.execute("PRAGMA table_info('squads')")
    columns = cursor.fetchall()
    print(f"{'cid':<4} {'name':<20} {'type':<15} {'notnull':<8} {'dflt_value':<15} {'pk':<4}")
    print("-" * 80)
    for col in columns:
        cid, name, type_, notnull, dflt_value, pk = col
        print(f"{cid:<4} {name:<20} {type_:<15} {notnull:<8} {str(dflt_value):<15} {pk:<4}")
    
    # 3. PRAGMA foreign_key_list
    print("\nPRAGMA foreign_key_list('squads'):")
    print("-" * 40)
    cursor.execute("PRAGMA foreign_key_list('squads')")
    fks = cursor.fetchall()
    if fks:
        print(f"{'id':<4} {'seq':<4} {'table':<15} {'from':<15} {'to':<15} {'on_update':<15} {'on_delete':<15}")
        print("-" * 100)
        for fk in fks:
            id_, seq, table, from_, to, on_update, on_delete, match = fk
            print(f"{id_:<4} {seq:<4} {table:<15} {from_:<15} {to:<15} {on_update:<15} {on_delete:<15}")
    else:
        print("No foreign keys found")
    
    # 4. PRAGMA index_list
    print("\nPRAGMA index_list('squads'):")
    print("-" * 40)
    cursor.execute("PRAGMA index_list('squads')")
    indexes = cursor.fetchall()
    if indexes:
        for idx in indexes:
            print(f"Index: {idx}")
            # PRAGMA index_info 可能有多個返回值
            if len(idx) >= 2:
                index_name = idx[1]
                print(f"  PRAGMA index_info('{index_name}'):")
                cursor.execute(f"PRAGMA index_info('{index_name}')")
                idx_info = cursor.fetchall()
                for info in idx_info:
                    print(f"    {info}")
    else:
        print("No indexes found")
    
    conn.close()
    
    return create_table_sql[0], columns, fks, indexes

def analyze_prisma_squad():
    """分析 Prisma Squad 模型"""
    schema_path = os.path.join(os.path.dirname(__file__), 'prisma', 'schema.prisma')
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("\n" + "=" * 60)
    print("2. PRISMA SQUAD CONTRACT")
    print("=" * 60)
    
    # 查找 Squad 模型
    squad_pattern = r'model Squad\s*{(.*?)(?=\nmodel|\n\n|\Z)}'
    match = re.search(squad_pattern, content, re.DOTALL)
    
    if not match:
        print("ERROR: Squad model not found in schema.prisma")
        return None
    
    squad_def = match.group(1).strip()
    
    print("\nFull Squad model definition:")
    print("-" * 40)
    print(f"model Squad {{")
    for line in squad_def.split('\n'):
        print(f"  {line}")
    print(f"}}")
    
    # 提取詳細資訊
    print("\nDetailed analysis:")
    print("-" * 40)
    
    lines = squad_def.split('\n')
    for line in lines:
        line = line.strip()
        if line and not line.startswith('//'):
            print(f"  {line}")
    
    return squad_def

if __name__ == "__main__":
    sqlite_ddl, columns, fks, indexes = analyze_squads_structure()
    prisma_def = analyze_prisma_squad()