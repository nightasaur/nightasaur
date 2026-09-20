import os

def repair_squad_name_default():
    """修復 Squad.name 的預設值編碼問題"""
    schema_path = os.path.join(os.path.dirname(__file__), 'prisma', 'schema.prisma')
    
    print("開始修復 Squad.name 編碼契約...")
    print("=" * 60)
    
    # 讀取檔案
    with open(schema_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 檢查原始內容
    print("1. 檢查當前 Squad 模型:")
    print("-" * 40)
    
    # 查找 Squad 模型
    import re
    squad_pattern = r'model Squad\s*{[^}]+}'
    match = re.search(squad_pattern, content, re.DOTALL)
    
    if not match:
        print("錯誤: 找不到 Squad 模型")
        return False
    
    squad_content = match.group(0)
    print("找到 Squad 模型:")
    print(squad_content)
    
    # 檢查 name 欄位
    name_pattern = r'name\s+String\s+@default\("[^"]+"\)'
    name_match = re.search(name_pattern, squad_content)
    
    if not name_match:
        print("錯誤: 找不到 name 欄位")
        return False
    
    current_default = name_match.group(0)
    print(f"\n2. 當前 name 預設值: {current_default}")
    
    # 檢查是否已經是正確的值
    if '我的小隊' in current_default:
        print("✓ Squad.name 已經有正確的預設值")
        print("不需要修改")
        return True
    
    # 檢查是否有編碼異常
    if '????' in current_default:
        print("✗ 檢測到編碼異常: '????蹎抆??'")
        encoding_corruption = True
    else:
        print(f"當前值: {current_default}")
        encoding_corruption = False
    
    # 執行修復
    print(f"\n3. 執行編碼修復...")
    
    # 替換整個檔案中的錯誤值
    old_text = 'name      String        @default("????蹎抆??")'
    new_text = 'name      String        @default("我的小隊")'
    
    if old_text in content:
        content = content.replace(old_text, new_text)
        print(f"✓ 已修復: {old_text} → {new_text}")
        repaired = True
    else:
        print("✗ 找不到要修復的文本")
        repaired = False
    
    # 寫回檔案
    if repaired:
        with open(schema_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✓ 檔案已保存")
    
    # 驗證修復
    print(f"\n4. 驗證修復結果...")
    with open(schema_path, 'r', encoding='utf-8') as f:
        new_content = f.read()
    
    # 再次查找 Squad 模型
    match = re.search(squad_pattern, new_content, re.DOTALL)
    if match:
        new_squad = match.group(0)
        print("修復後的 Squad 模型:")
        print(new_squad)
        
        # 檢查 name 欄位
        name_match = re.search(name_pattern, new_squad)
        if name_match:
            final_default = name_match.group(0)
            print(f"\n5. 最終 name 預設值: {final_default}")
            
            if '我的小隊' in final_default:
                print("✓ 修復成功!")
                return True
            else:
                print("✗ 修復失敗: 預設值未正確更新")
                return False
        else:
            print("✗ 修復失敗: 找不到 name 欄位")
            return False
    else:
        print("✗ 修復失敗: 找不到 Squad 模型")
        return False

if __name__ == "__main__":
    success = repair_squad_name_default()
    if success:
        print("\n" + "=" * 60)
        print("SQUAD ENCODING CONTRACT REPAIR COMPLETED SUCCESSFULLY")
    else:
        print("\n" + "=" * 60)
        print("SQUAD ENCODING CONTRACT REPAIR FAILED")