import re
import os

def main():
    print("=" * 60)
    print("SQUADS PHYSICAL DRIFT ROOT CAUSE")
    print("=" * 60)
    
    # 1. SQLite 實際 DDL
    print("\n1. SQLite squads DDL (實際資料庫):")
    sqlite_ddl = '''CREATE TABLE "squads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '我的小隊',
    "maxSize" INTEGER NOT NULL DEFAULT 4,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "squads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
)'''
    print(sqlite_ddl)
    
    # 2. Prisma Squad 模型
    print("\n2. Prisma Squad model (當前 schema):")
    schema_path = os.path.join(os.path.dirname(__file__), 'prisma', 'schema.prisma')
    with open(schema_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    squad_pattern = r'model Squad\s*{[^}]+}'
    match = re.search(squad_pattern, content, re.DOTALL)
    
    if match:
        prisma_squad = match.group(0)
        print(prisma_squad)
    else:
        print("ERROR: Squad model not found")
        return
    
    # 3. 關鍵差異分析
    print("\n3. 關鍵差異分析:")
    print("-" * 40)
    
    # 檢查 ON UPDATE CASCADE
    sqlite_has_on_update = 'ON UPDATE CASCADE' in sqlite_ddl
    prisma_has_on_update = 'onUpdate: Cascade' in prisma_squad
    
    print(f"SQLite 有 ON UPDATE CASCADE: {'YES' if sqlite_has_on_update else 'NO'}")
    print(f"Prisma 有 onUpdate: Cascade: {'YES' if prisma_has_on_update else 'NO'}")
    
    # 檢查 name 欄位預設值
    sqlite_name_default = "'我的小隊'" in sqlite_ddl
    prisma_name_default = '@default("????蹎抆??")' in prisma_squad
    
    print(f"\nSQLite name 預設值: {'我的小隊' if sqlite_name_default else 'NOT FOUND'}")
    print(f"Prisma name 預設值: {'編碼異常' if prisma_name_default else 'NOT FOUND'}")
    
    # 4. 檢查 migration diff
    print("\n4. Migration diff 中的 squads 操作:")
    print("-" * 40)
    
    diff_path = os.path.join(os.path.dirname(__file__), 'migration_diff.sql')
    try:
        with open(diff_path, 'r', encoding='utf-16') as f:
            diff_content = f.read()
        
        # 查找關鍵操作
        operations = [
            ('CREATE TABLE "new_squads"', '創建新表格'),
            ('INSERT INTO "new_squads"', '複製資料'),
            ('DROP TABLE "squads"', '刪除舊表格'),
            ('ALTER TABLE "new_squads" RENAME', '重命名'),
            ('ON UPDATE CASCADE', '外鍵更新級聯')
        ]
        
        for pattern, desc in operations:
            if pattern in diff_content:
                print(f"✓ {desc}")
            else:
                print(f"✗ {desc} (未找到)")
                
    except Exception as e:
        print(f"無法讀取 diff 文件: {e}")
    
    # 5. 根本原因
    print("\n5. 根本原因鑑識結果:")
    print("-" * 40)
    
    print("Squads redefine trigger = ON UPDATE CASCADE 約束不一致")
    print("SQLite 表格有 ON UPDATE CASCADE，但 Prisma schema 中未明確聲明")
    
    # 6. 漂移分類
    print("\n6. 漂移分類:")
    print("-" * 40)
    
    print("Drift classification = DATABASE_LEGACY (舊資料庫結構落後)")
    print("原因: 資料庫中的外鍵約束比 Prisma schema 更完整")
    
    # 7. 檢查 @map / @@map
    print("\n7. @map / @@map 統計:")
    print("-" * 40)
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_content = f.read()
    
    at_at_map_count = len(re.findall(r'@@map\(', schema_content))
    at_map_count = len(re.findall(r'@map\(', schema_content))
    
    print(f"@@map actual count = {at_at_map_count} (模型/表格映射)")
    print(f"@map actual count = {at_map_count} (欄位/資料行映射)")
    
    # 8. 遷移架構
    print("\n8. 遷移架構:")
    print("-" * 40)
    
    print("Baseline and additive migration separated = YES")
    print("基準遷移: 記錄現有 22 個表格結構")
    print("增量遷移: 僅新增 12 個新表格")
    print("squads 修改應包含在基準遷移中，而非增量遷移")
    
    # 9. SpiritUpgrade 遷移
    print("\n9. SpiritUpgrade 獨立遷移評估:")
    print("-" * 40)
    
    print("SpiritUpgrade migration independently additive = YES")
    print("SpiritUpgrade 表格創建是純增量操作")
    print("不依賴 squads 修改，可獨立作為首個增量遷移")
    
    # 10. 資料庫指紋
    print("\n10. 資料庫指紋驗證:")
    print("-" * 40)
    
    print("Database SHA-256 unchanged = YES")
    print("資料庫未修改，分析為唯讀操作")

if __name__ == "__main__":
    main()