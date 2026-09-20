import re
import os

def analyze_schema_mappings():
    schema_path = os.path.join(os.path.dirname(__file__), 'prisma', 'schema.prisma')
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 12 個 SCHEMA_ONLY 模型
    schema_only_models = [
        'SpiritUpgrade',
        'DailyPuzzle',
        'PuzzleLevel',
        'SpiritPuzzleProgress',
        'HatchingRecord',
        'HatchingInteraction',
        'SocialPost',
        'PlayerLocation',
        'Hotspot',
        'LocationSpawn',
        'LocationVisit',
        'ARCapture'
    ]
    
    # 現有的 22 個模型
    existing_models = [
        'User', 'Spirit', 'GenerationTask', 'Squad', 'SquadMember',
        'LanguagePreference', 'UserSettings', 'PasswordResetToken',
        'Session', 'SquadTraining', 'Item', 'UserItem', 'Quest',
        'QuestProgress', 'Evolution', 'Conversation', 'LearningSession',
        'Achievement', 'UserAchievement', 'Translation', 'UserLanguageHistory',
        'LearningProgress'
    ]
    
    print("=" * 60)
    print("1. INSPECT ALL @@map / @map")
    print("=" * 60)
    
    # 統計所有 @@map 和 @map
    at_at_map_count = len(re.findall(r'@@map\(', content))
    at_map_count = len(re.findall(r'@map\(', content))
    
    print(f"\n@@map count = {at_at_map_count}")
    print(f"@map count = {at_map_count}")
    
    print("\nExisting table mapping verification:")
    print("-" * 40)
    
    # 檢查現有模型的映射
    for model in existing_models:
        pattern = rf'model {model}.*?@@map\("([^"]+)"\)'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            table_name = match.group(1)
            print(f"{model:25} → {table_name}")
        else:
            # 檢查是否有 @map 在欄位上
            print(f"{model:25} → NO @@map FOUND")
    
    print("\n" + "=" * 60)
    print("2. VERIFY 12 NEW PHYSICAL TABLE NAMES")
    print("=" * 60)
    
    print("\nSchema-only models @@map analysis:")
    print("-" * 40)
    
    model_table_mapping = {}
    
    for model in schema_only_models:
        pattern = rf'model {model}.*?@@map\("([^"]+)"\)'
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            table_name = match.group(1)
            model_table_mapping[model] = table_name
            print(f"{model:25} @@map PRESENT = YES")
            print(f"{'':25} @@map VALUE = {table_name}")
            print(f"{'':25} EXPECTED PHYSICAL TABLE = {table_name}")
        else:
            model_table_mapping[model] = None
            print(f"{model:25} @@map PRESENT = NO")
            print(f"{'':25} @@map VALUE = NONE")
            print(f"{'':25} EXPECTED PHYSICAL TABLE = UNKNOWN (no @@map)")
        print()
    
    # 檢查 Prisma 的預設命名規則
    print("\nPrisma default naming behavior:")
    print("-" * 40)
    print("Without @@map, Prisma typically converts:")
    print("  PascalCase model name → snake_case plural")
    print("  Example: SpiritUpgrade → spirit_upgrades")
    
    return model_table_mapping

if __name__ == "__main__":
    analyze_schema_mappings()