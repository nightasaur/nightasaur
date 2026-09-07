# Nightasaur 系統重新設定 - 完整文檔

## 概述
本文檔記錄了 Nightasaur 遊戲系統的全面重新設定，包括命名系統、孵化系統和精靈外觀系統的升級。

## 📝 命名系統重新設定

### 核心功能
1. **多語言命名詞庫**
   - 支持繁體中文、簡體中文、英文、日文、韓文
   - 每種語言都有專屬的命名詞庫和風格

2. **8種命名風格**
   - CLASSIC (經典): 小烈焰、潮汐兒
   - MYTHICAL (神話): 麒麟、鳳凰
   - NATURE (自然): 翠葉、星塵
   - MODERN (現代): 電光、數據
   - CUTE (可愛): 布丁、棉花糖
   - MYSTERIOUS (神秘): 暗影、幽靈
   - SCIENTIFIC (科學): 量子、弦論
   - CULTURAL (文化): 武士、忍者

3. **AI輔助命名**
   - 基於元素和性格生成個性化名稱
   - 提供多個選項供玩家選擇

4. **名稱驗證系統**
   - 長度檢查 (2-20字符)
   - 字符驗證 (只允許有效字符)
   - 禁止詞彙過濾
   - 重複名稱檢查
   - 適宜性評分 (0-100分)

### API 接口
```
GET    /api/spirit-systems/naming/suggestions?element=FIRE&count=5
POST   /api/spirit-systems/naming/validate
POST   /api/spirit-systems/naming/ai-suggestions
GET    /api/spirit-systems/naming/history
POST   /api/spirit-systems/naming/save
```

## 🥚 孵化系統重新設定

### 核心功能
1. **環境模擬系統**
   - 溫度控制 (20-40°C)
   - 濕度控制 (30-80%)
   - 實時環境監測

2. **5種互動方式**
   - TAP (拍打): 增加溫度，中等進度
   - SHAKE (搖晃): 大幅增加溫度，高進度
   - WHISPER (低語): 增加濕度，降低溫度，低進度
   - SING (唱歌): 平衡溫濕度，高進度
   - STORY (講故事): 最佳互動，最高進度

3. **孵化條件系統**
   - 溫度條件: 保持在適宜範圍
   - 濕度條件: 保持在適宜範圍
   - 互動條件: 完成足夠次數的互動
   - 時間條件: 達到最小孵化時間

4. **孵化事件系統**
   - 溫度變化事件
   - 濕度變化事件
   - 互動事件
   - 時間流逝事件
   - 特殊孵化事件

5. **獎勵系統**
   - 基礎經驗值和金幣
   - 條件滿足獎勵加成
   - 互動次數獎勵加成
   - 稀有物品掉落 (10%機率)

### API 接口
```
POST   /api/spirit-systems/hatching/start
POST   /api/spirit-systems/hatching/interact
GET    /api/spirit-systems/hatching/status/:spiritId
GET    /api/spirit-systems/hatching/history
POST   /api/spirit-systems/hatching/batch-interact
POST   /api/spirit-systems/hatching/accelerate
```

## 🎨 精靈外觀系統重新設定

### 核心功能
1. **動物園主題設計**
   - 基於真實動物園動物分類
   - 7大動物類別:
     - MAMMALS (哺乳類): 獅子、老虎、熊貓等
     - BIRDS (鳥類): 孔雀、老鷹、貓頭鷹等
     - REPTILES (爬蟲類): 鱷魚、蜥蜴、烏龜等
     - AMPHIBIANS (兩棲類): 青蛙、蠑螈、蟾蜍等
     - FISH (魚類): 金魚、鯊魚、海豚等
     - INSECTS (昆蟲類): 蝴蝶、蜜蜂、螢火蟲等
     - MYTHICAL (神話生物): 龍、鳳凰、獨角獸等

2. **外觀組件系統**
   - 10個身體部位: 頭部、身體、腿部、翅膀、尾巴等
   - 每個部位可自定義: 類型、大小、顏色、紋理
   - 特殊特徵系統: 角、耳朵、眼睛、嘴巴、花紋

3. **基因遺傳系統**
   - 顯性基因和隱性基因
   - 父母特徵遺傳 (70%機率)
   - 基因突變 (5%機率)
   - 隱藏特徵系統

4. **顏色與紋理系統**
   - 3層顏色系統: 主色、次色、強調色
   - 10種紋理類型: 光滑、鱗片、毛茸茸、羽毛等
   - 特殊效果: 發光、半透明、閃爍、粒子效果

5. **尺寸系統**
   - 高度: 0.1-3.0公尺
   - 重量: 0.1-100公斤
   - 比例系統: 1-10級

### 數據庫結構
```
spirit_appearances        # 精靈外觀主表
appearance_genes         # 外觀基因表
appearance_changes       # 外觀變更歷史
```

## 🔧 技術實現

### 文件結構
```
apps/backend/
├── src/
│   ├── controllers/
│   │   ├── namingController.ts      # 命名控制器
│   │   ├── hatchingController.ts    # 孵化控制器
│   │   └── spirits.ts              # 精靈控制器
│   ├── services/
│   │   ├── namingService.ts         # 命名服務
│   │   ├── hatchingService.ts       # 孵化服務
│   │   └── spirit.ts               # 精靈服務
│   ├── utils/
│   │   ├── namingSystem.ts          # 命名系統配置
│   │   ├── hatchingSystem.ts        # 孵化系統配置
│   │   └── appearanceSystem.ts      # 外觀系統配置
│   ├── routes/
│   │   └── spiritSystems.ts         # 系統路由
│   └── middleware/
│       └── auth.ts                  # 認證中間件
├── prisma/
│   ├── migrations/
│   │   └── 20260905120000_add_spirit_systems/
│   │       └── migration.sql       # 數據庫遷移
│   └── schema.prisma               # Prisma 模型
└── complete-spirit-server.ts       # 完整服務器
```

### 數據庫遷移
新增了以下數據表:
1. `naming_history` - 命名歷史記錄
2. `hatching_records` - 孵化記錄
3. `hatching_interactions` - 孵化互動
4. `spirit_appearances` - 精靈外觀
5. `appearance_genes` - 外觀基因
6. `appearance_changes` - 外觀變更歷史

## 🚀 部署與使用

### 啟動服務器
```bash
cd apps/backend
npm install
npx prisma migrate deploy
npm run dev
```

### 測試新系統
```bash
node test-new-systems.js
```

### API 測試示例
```bash
# 測試命名系統
curl "http://localhost:3001/api/spirit-systems/naming/suggestions?element=FIRE&count=3"

# 測試孵化系統
curl -X POST "http://localhost:3001/api/spirit-systems/hatching/start" \
  -H "Content-Type: application/json" \
  -d '{"spiritId": "test_123", "temperature": 30, "humidity": 50}'

# 測試系統狀態
curl "http://localhost:3001/api/system/status"
```

## 📈 未來擴展

### 短期計劃
1. **外觀編輯器界面**
   - 可視化外觀編輯工具
   - 實時預覽系統
   - 顏色調色板

2. **社交分享系統**
   - 精靈外觀分享
   - 命名創意分享
   - 孵化過程記錄

3. **成就系統整合**
   - 命名大師成就
   - 孵化專家成就
   - 外觀設計師成就

### 長期願景
1. **AR外觀展示**
   - 使用AR技術展示精靈
   - 真實世界互動
   - 拍照分享功能

2. **基因培育系統**
   - 精靈繁殖系統
   - 基因組合實驗
   - 稀有變異培育

3. **生態系統整合**
   - 與AR探索系統結合
   - 與小隊系統整合
   - 與社交系統連接

## 🎯 總結

本次系統重新設定為 Nightasaur 帶來了:
- ✅ 更豐富的命名體驗
- ✅ 更有趣的孵化過程
- ✅ 更個性化的精靈外觀
- ✅ 更完善的技術架構
- ✅ 更易擴展的系統設計

所有系統都已模塊化設計，便於後續維護和擴展。