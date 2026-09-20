import sqlite3
import os

def check_database():
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    if not os.path.exists(db_path):
        print(f"Database file not found: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 獲取所有應用程式表格
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%' 
        AND name NOT LIKE '_prisma_%' 
        ORDER BY name
    """)
    
    tables = cursor.fetchall()
    
    print("TABLE,ROW_COUNT")
    total_rows = 0
    tables_with_data = 0
    empty_tables = 0
    
    for table in tables:
        table_name = table[0]
        try:
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            count = cursor.fetchone()[0]
            print(f"{table_name},{count}")
            total_rows += count
            if count > 0:
                tables_with_data += 1
            else:
                empty_tables += 1
        except Exception as e:
            print(f"{table_name},ERROR - {str(e)}")
    
    print(f"\nSummary:")
    print(f"Tables with data: {tables_with_data}")
    print(f"Empty tables: {empty_tables}")
    print(f"Total rows across application tables: {total_rows}")
    
    # 檢查 Squad 和 SquadMember 的結構
    print("\n\nChecking Squad and SquadMember structure:")
    
    for table_name in ['squads', 'squad_members']:
        try:
            cursor.execute(f"PRAGMA table_info(\"{table_name}\")")
            columns = cursor.fetchall()
            print(f"\n{table_name} columns:")
            for col in columns:
                print(f"  {col[1]} ({col[2]}, nullable: {not col[3]})")
        except:
            print(f"\n{table_name}: Table not found")
    
    conn.close()

if __name__ == "__main__":
    check_database()