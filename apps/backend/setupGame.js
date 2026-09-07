#!/usr/bin/env node

import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

async function setupGameSystem() {
  console.log("🎮 啟動夜龍遊戲系統...\n");
  
  try {
    // 1. 檢查環境
    console.log("1. 檢查環境...");
    const { stdout: nodeVersion } = await execAsync("node --version");
    console.log(`   Node.js 版本: ${nodeVersion.trim()}`);
    
    // 2. 安裝依賴
    console.log("\n2. 安裝依賴...");
    await execAsync("npm install", { cwd: __dirname });
    console.log("   ✅ 依賴安裝完成");
    
    // 3. 生成 Prisma 客戶端
    console.log("\n3. 生成 Prisma 客戶端...");
    await execAsync("npx prisma generate", { cwd: __dirname });
    console.log("   ✅ Prisma 客戶端生成完成");
    
    // 4. 執行資料庫遷移
    console.log("\n4. 執行資料庫遷移...");
    await execAsync("npx prisma migrate deploy", { cwd: __dirname });
    console.log("   ✅ 資料庫遷移完成");
    
    // 5. 種子遊戲數據
    console.log("\n5. 種子遊戲數據...");
    await execAsync("node prisma/seedGame.js", { cwd: __dirname });
    console.log("   ✅ 遊戲數據種子完成");
    
    // 6. 種子益智關卡
    console.log("\n6. 種子益智關卡...");
    await execAsync("node prisma/seedPuzzles.js", { cwd: __dirname });
    console.log("   ✅ 益智關卡種子完成");
    
    // 7. 測試系統
    console.log("\n7. 測試遊戲系統...");
    await execAsync("node testGameSystem.js", { cwd: __dirname });
    console.log("   ✅ 系統測試完成");
    
    // 8. 啟動伺服器
    console.log("\n8. 啟動遊戲伺服器...");
    console.log("\n========================================");
    console.log("🦖 夜龍遊戲系統啟動成功！");
    console.log("========================================");
    console.log("\n📋 可用功能:");
    console.log("   • 精靈培育與進化");
    console.log("   • 益智升級系統 (智力/創造力/邏輯/記憶)");
    console.log("   • 任務與成就系統");
    console.log("   • 每日挑戰與排行榜");
    console.log("   • AI 對話互動");
    console.log("   • WebRTC 語音聊天");
    console.log("\n🔗 API 端點:");
    console.log("   http://localhost:3000/api/health");
    console.log("   http://localhost:3000/api/game-logic/overview");
    console.log("   http://localhost:3000/api/puzzles/daily");
    console.log("\n🚀 啟動伺服器:");
    console.log("   npm run dev");
    console.log("\n========================================");
    
  } catch (error) {
    console.error("\n❌ 啟動失敗:", error.message);
    process.exit(1);
  }
}

// 執行啟動流程
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  setupGameSystem();
}

export { setupGameSystem };