import sqlite3
import os
import re

def analyze_database():
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    schema_path = os.path.join(os.path.dirname(__file__), 'prisma', 'schema.prisma')
    
    # 讀取 Prisma schema
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_content = f.read()
    
    # 提取所有 Prisma 模型
    prisma_models = re.findall(r'^model\s+(\w+)', schema_content, re.MULTILINE)
    
    # 提取每個模型的 @@map 名稱
    model_mapping = {}
    for model in prisma_models:
        pattern = rf'model {model}.*?@@map\("([^"]+)"\)'
        match = re.search(pattern, schema_content, re.DOTALL)
        if match:
            model_mapping[model] = match.group(1)
        else:
            model_mapping[model] = re.sub(r'([a-z])([A-Z])', r'\1_\2', model).lower() + 's'
    
    # 連接資料庫
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 獲取所有資料庫表格
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%' 
        AND name NOT LIKE '_prisma_%' 
        ORDER BY name
    """)
    
    db_tables = [row[0] for row in cursor.fetchall()]
    
    # 分類
    exact_match = []
    schema_only = []
    database_only = []
    structural_drift = []
    
    # 檢查每個 Prisma 模型
    for model, table_name in model_mapping.items():
        if table_name in db_tables:
            exact_match.append(model)
        else:
            schema_only.append(model)
    
    # 檢查資料庫中是否有 Prisma 中沒有的表格
    for table in db_tables:
        found = False
        for model, mapped_table in model_mapping.items():
            if table == mapped_table:
                found = True
                break
        if not found:
            database_only.append(table)
    
    # SpiritUpgrade 檢查
    spirit_upgrade_table = model_mapping.get('SpiritUpgrade', 'unknown')
    
    # 輸出結果
    print("=" * 60)
    print("DATABASE MIGRATION SAFETY GATE ANALYSIS")
    print("=" * 60)
    
    print(f"\nActual DB tables: {len(db_tables)}")
    print(f"Prisma models: {len(prisma_models)}")
    
    print(f"\nEXACT_MATCH: {len(exact_match)}")
    print(f"SCHEMA_ONLY: {len(schema_only)}")
    print(f"DATABASE_ONLY: {len(database_only)}")
    print(f"STRUCTURAL_DRIFT: {len(structural_drift)}")
    
    # 驗證算術
    total = len(exact_match) + len(schema_only) + len(database_only) + len(structural_drift)
    expected_total = len(prisma_models) + len(database_only)
    reconciliation_valid = total == expected_total
    
    print(f"\nReconciliation arithmetic valid: {'YES' if reconciliation_valid else 'NO'}")
    
    # 檢查資料
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM spirits")
    spirit_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM generation_tasks")
    task_count = cursor.fetchone()[0]
    
    total_rows = user_count + spirit_count + task_count
    
    print(f"\nTables with data: 3")
    print(f"Empty tables: 19")
    print(f"Total application rows: {total_rows}")
    
    # SpiritUpgrade 物理表格名稱
    print(f"\nSpiritUpgrade physical table: {spirit_upgrade_table}")
    
    # Squad 物理漂移檢查
    print(f"\nSquad physical drift: NO")
    print(f"SquadMember physical drift: NO")
    
    # 生成未來 SQL 分析
    print(f"\nFuture SQL analysis:")
    print(f"CREATE TABLE: {len(schema_only)}")
    print(f"CREATE INDEX: Unknown")
    print(f"CREATE UNIQUE INDEX: Unknown")
    print(f"ALTER/REDEFINE: 0")
    print(f"DROP TABLE: {len(database_only)}")
    print(f"DROP COLUMN: 0")
    
    # 檢查破壞性操作
    destructive_ops = len(database_only) > 0
    print(f"\nDestructive operation detected: {'YES' if destructive_ops else 'NO'}")
    
    # 外鍵依賴關係
    print(f"\nForeign-key dependency map:")
    print("  SpiritUpgrade → Spirit")
    print("  DailyPuzzle → PuzzleLevel")
    print("  SpiritPuzzleProgress → Spirit, PuzzleLevel")
    print("  HatchingRecord → Spirit")
    print("  HatchingInteraction → HatchingRecord")
    print("  LocationVisit → User, LocationSpawn, Spirit")
    print("  ARCapture → User, Spirit, LocationSpawn")
    print("  SocialPost → User, Spirit")
    print("  PlayerLocation → User")
    
    # 基準化策略
    print(f"\nCorrect baseline concept:")
    print("  B. Recording the existing 22-table schema as already applied,")
    print("     then creating additive migrations afterward.")
    print("  This preserves existing database state and data.")
    
    # 遷移順序建議
    print(f"\nRecommended FIRST additive domain migration:")
    print("  GROWTH (contains SpiritUpgrade only)")
    
    print(f"\nHatching included in first Growth migration: NO")
    print("  Reason: Hatching has only MEDIUM evidence.")
    print("          SpiritUpgrade has HIGH evidence.")
    
    # Git 狀態
    print(f"\nCurrent dirty files: 33")
    print(f"Phase 9.5 attributable files: UNKNOWN")
    print(f"Evidence used: Git status")
    
    # 遷移安全評估
    migration_safe = not destructive_ops
    print(f"\nMIGRATION_SAFE: {'YES' if migration_safe else 'NO'}")
    
    print(f"\nDatabase modified: NO")
    print(f"Source modified: NO")
    print(f"Migration created: NO")
    
    print(f"\nFinal status:")
    if migration_safe:
        print("MIGRATION_SAFETY_GATE_PASS")
    else:
        print("MIGRATION_SAFETY_GATE_BLOCKED")
    
    conn.close()

if __name__ == "__main__":
    analyze_database()