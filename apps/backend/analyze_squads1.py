import sqlite3
import os

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
        print(f"{'seq':<4} {'name':<30} {'unique':<8}")
        print("-" * 50)
        for idx in indexes:
            seq, name, unique = idx
            print(f"{seq:<4} {name:<30} {unique:<8}")
            
            # 5. PRAGMA index_info for each index
            print(f"  PRAGMA index_info('{name}'):")
            cursor.execute(f"PRAGMA index_info('{name}')")
            idx_info = cursor.fetchall()
            for info in idx_info:
                seqno, cid, name_col = info
                print(f"    seqno={seqno}, cid={cid}, name='{name_col}'")
    else:
        print("No indexes found")
    
    conn.close()
    
    return create_table_sql[0], columns, fks, indexes

if __name__ == "__main__":
    analyze_squads_structure()