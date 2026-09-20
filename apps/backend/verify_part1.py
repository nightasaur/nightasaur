import subprocess
import os
import re

def check_database_hash():
    """檢查資料庫哈希值"""
    import hashlib
    db_path = os.path.join(os.path.dirname(__file__), 'prisma', 'dev.db')
    
    with open(db_path, 'rb') as f:
        content = f.read()
    
    sha256_hash = hashlib.sha256(content).hexdigest().upper()
    expected = "EB7BEA2222849276D1B323598BD5C27B51A4ED4AFA1DCF19A468832A44CDF0C3"
    
    return sha256_hash == expected, sha256_hash

def analyze_schema_mappings():
    """分析 schema 映射"""
    schema_path = os.path.join(os.path.dirname(__file__), 'prisma', 'schema.prisma')
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 統計 @@map 和 @map
    at_at_map_count = len(re.findall(r'@@map\(', content))
    at_map_count = len(re.findall(r'@map\(', content))
    
    # 12 個 SCHEMA_ONLY 模型
    schema_only_models = [
        'SpiritUpgrade', 'DailyPuzzle', 'PuzzleLevel', 'SpiritPuzzleProgress',
        'HatchingRecord', 'HatchingInteraction', 'SocialPost', 'PlayerLocation',
        'Hotspot', 'LocationSpawn', 'LocationVisit', 'ARCapture'
    ]
    
    model_mappings = {}
    for model in schema_only_models:
        pattern = rf'model {model}.*?@@map\("([^"]+)"\)'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            model_mappings[model] = match.group(1)
        else:
            model_mappings[model] = None
    
    return at_at_map_count, at_map_count, model_mappings

def generate_sql_diff():
    """生成 SQL diff"""
    cmd = [
        "npx", "prisma", "migrate", "diff",
        "--from-url", "file:./prisma/dev.db",
        "--to-schema-datamodel", "./prisma/schema.prisma",
        "--script"
    ]
    
    try:
        result = subprocess.run(
            cmd,
            cwd=os.path.dirname(__file__),
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        
        if result.returncode == 0:
            return result.stdout
        else:
            print(f"Error: {result.stderr[:200]}")
            return None
    except Exception as e:
        print(f"Exception: {e}")
        return None