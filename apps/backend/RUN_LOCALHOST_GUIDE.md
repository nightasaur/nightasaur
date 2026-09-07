# 🚀 Nightasaur 遊戲系統 - 本地運行完整指南

## 📋 系統概述

您已成功創建以下系統：
1. **益智升級系統** - 4種益智類型，5種難度等級
2. **隨從小隊系統** - 精靈小隊管理，主精靈切換
3. **AR位置探索系統** - Pokémon GO 風格的 AR 捕捉
4. **語言設定系統** - 中文/英文/雙語顯示模式

## 🛠️ 環境要求

### 必要軟體
1. **Node.js** - 版本 18 或更高
2. **npm** - Node.js 套件管理器
3. **Git** - 版本控制（可選）

### 檢查環境
```bash
# 檢查 Node.js 版本
node --version

# 檢查 npm 版本
npm --version

# 檢查 Git 版本（可選）
git --version
```

## 📁 項目結構

```
c:\Nightasaur\
├── apps\
│   └── backend\          # 後端服務器
│       ├── src\          # 源代碼
│       ├── prisma\       # 數據庫配置
│       ├── package.json  # 項目配置
│       ├── .env          # 環境變數
│       └── ...           # 其他文件
```

## 🚀 快速啟動腳本

我為您創建了一個一鍵啟動腳本：

### `runLocalhost.js`

```javascript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

console.log("🎮 Nightasaur 遊戲系統 - 本地啟動程序");
console.log("=".repeat(50));

async function checkEnvironment() {
  console.log("🔍 檢查環境...");
  
  try {
    // 檢查 Node.js
    const nodeVersion = await execAsync("node --version");
    console.log(`✅ Node.js 版本: ${nodeVersion.stdout.trim()}`);
    
    // 檢查 npm
    const npmVersion = await execAsync("npm --version");
    console.log(`✅ npm 版本: ${npmVersion.stdout.trim()}`);
    
    return true;
  } catch (error) {
    console.error("❌ 環境檢查失敗:", error.message);
    console.log("\n💡 請確保已安裝：");
    console.log("  1. Node.js (版本 18+)");
    console.log("  2. npm (Node.js 自帶)");
    return false;
  }
}

async function installDependencies() {
  console.log("\n📦 安裝依賴套件...");
  
  try {
    const { stdout, stderr } = await execAsync("npm install");
    if (stderr && !stderr.includes("npm WARN")) {
      console.error("⚠️  安裝警告:", stderr);
    }
    console.log("✅ 依賴套件安裝完成");
    return true;
  } catch (error) {
    console.error("❌ 安裝失敗:", error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log("\n🗄️  設定資料庫...");
  
  try {
    // 運行資料庫遷移
    console.log("  1. 運行資料庫遷移...");
    await execAsync("npx prisma migrate deploy");
    
    // 生成 Prisma 客戶端
    console.log("  2. 生成 Prisma 客戶端...");
    await execAsync("npx prisma generate");
    
    // 載入種子數據
    console.log("  3. 載入遊戲數據...");
    await execAsync("node prisma/seedGame.js");
    
    // 載入益智關卡
    console.log("  4. 載入益智關卡...");
    await execAsync("node prisma/seedPuzzles.js");
    
    // 載入熱點數據
    console.log("  5. 載入 AR 熱點數據...");
    await execAsync("node prisma/seedHotspots.js");
    
    // 載入翻譯數據
    console.log("  6. 載入語言翻譯數據...");
    await execAsync("node prisma/seedTranslations.js");
    
    console.log("✅ 資料庫設定完成");
    return true;
  } catch (error) {
    console.error("❌ 資料庫設定失敗:", error.message);
    return false;
  }
}