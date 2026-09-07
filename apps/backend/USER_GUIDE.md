# 🦖 Nightasaur 遊戲後台系統 - 使用指南

## 📋 系統概述
Nightasaur 遊戲後台系統是一個支持多語言（繁體/簡體中文分離）的AR遊戲後台服務器，主要使用繁體中文界面。

## 🌐 訪問地址
- **首頁**: http://localhost:3000/
- **API基礎地址**: http://localhost:3000/api

## 🔧 主要功能

### 1. 多語言系統
- **主要語言**: 繁體中文 (zh-TW)
- **支持語言**: 
  - 繁體中文 (zh-TW) - 主要語言
  - 簡體中文 (zh-CN)
  - English (en-US)
- **語言切換**: 支持實時語言切換

### 2. AR位置探索系統
- 提供附近的AR地點信息
- 支持多語言地點名稱顯示
- 包含地理位置坐標

### 3. 系統監控
- 健康檢查API
- 服務器狀態監控
- 版本信息查詢

## 🔗 API 接口列表

### 基礎API
| 方法 | 路徑 | 描述 | 示例 |
|------|------|------|------|
| GET | `/` | 系統首頁 | http://localhost:3000/ |
| GET | `/api/health` | 健康檢查 | http://localhost:3000/api/health |
| GET | `/api/language/languages` | 獲取語言列表 | http://localhost:3000/api/language/languages |
| POST | `/api/language/switch` | 切換語言 | 見下方示例 |
| GET | `/api/ar/spawns/nearby` | AR地點查詢 | http://localhost:3000/api/ar/spawns/nearby |

### API 使用示例

#### 1. 健康檢查
```bash
curl http://localhost:3000/api/health
```

#### 2. 獲取語言列表
```bash
curl http://localhost:3000/api/language/languages
```

#### 3. 切換語言 (繁體中文 → 簡體中文)
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"language":"zh-CN"}' \
  http://localhost:3000/api/language/switch
```

#### 4. 切換語言 (簡體中文 → 繁體中文)
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"language":"zh-TW"}' \
  http://localhost:3000/api/language/switch
```

#### 5. 查詢AR地點
```bash
curl http://localhost:3000/api/ar/spawns/nearby
```

## 💻 系統測試

### 運行系統測試
```bash
cd C:\Nightasaur\apps\backend
node test-system.js
```

### 預期輸出
測試腳本會驗證所有系統功能：
1. 首頁訪問
2. 健康檢查
3. 多語言系統
4. 語言切換功能
5. AR位置系統

## 🚀 啟動系統

### 方法1: 直接啟動
```bash
cd C:\Nightasaur\apps\backend
npx tsx nightasaur-server.ts
```

### 方法2: 使用PowerShell腳本
```powershell
cd C:\Nightasaur\apps\backend
.\run.ps1
```

### 方法3: 使用批處理文件
```batch
cd C:\Nightasaur\apps\backend
run.bat
```

## 📊 系統狀態檢查

### 檢查服務器是否運行
```bash
curl http://localhost:3000/api/health
```

### 預期響應
```json
{
  "status": "ok",
  "timestamp": "2026-09-05T02:31:39.000Z",
  "service": "Nightasaur Backend",
  "version": "1.0.0",
  "primaryLanguage": "zh-TW",
  "languageDescription": "繁體中文 (主要語言)"
}
```

## 🔍 故障排除

### 問題1: 端口3000被佔用
```bash
# 查找佔用端口的進程
netstat -ano | findstr :3000

# 終止進程 (替換PID為實際值)
taskkill /F /PID [PID]
```

### 問題2: 服務器無法啟動
1. 檢查Node.js版本: `node --version` (需要18+)
2. 檢查依賴包: `npm install`
3. 檢查TypeScript: `npx tsc --version`

### 問題3: API無法訪問
1. 確認服務器正在運行
2. 檢查防火牆設置
3. 確認端口3000開放

## 📁 文件結構
```
C:\Nightasaur\apps\backend\
├── nightasaur-server.ts      # 主服務器文件
├── test-system.js           # 系統測試腳本
├── run.ps1                  # PowerShell啟動腳本
├── run.bat                  # 批處理啟動腳本
├── package.json             # 項目配置
└── README.md               # 項目文檔
```

## 📞 支持
如需技術支持，請檢查：
1. 服務器日誌輸出
2. API響應狀態碼
3. 系統資源使用情況

---

**最後更新**: 2026年9月5日  
**版本**: 1.0.0  
**主要語言**: 繁體中文