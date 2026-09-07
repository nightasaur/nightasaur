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

async function testSystem() {
  console.log("\n🧪 測試系統功能...");
  
  try {
    // 測試遊戲系統
    console.log("  1. 測試遊戲系統...");
    await execAsync("node testGameSystem.js");
    
    // 測試小隊系統
    console.log("  2. 測試小隊系統...");
    await execAsync("node testSquadSystem.js");
    
    // 測試 AR 系統
    console.log("  3. 測試 AR 系統...");
    await execAsync("node testARLocationSystem.js");
    
    // 測試語言系統
    console.log("  4. 測試語言系統...");
    await execAsync("node testLanguageSystem.js");
    
    // 完整系統測試
    console.log("  5. 完整系統測試...");
    await execAsync("node testCompleteSystem.js");
    
    console.log("✅ 所有系統測試通過");
    return true;
  } catch (error) {
    console.error("❌ 系統測試失敗:", error.message);
    return false;
  }
}

async function startServer() {
  console.log("\n🚀 啟動本地服務器...");
  
  return new Promise((resolve, reject) => {
    const serverProcess = exec("npm run dev");
    
    serverProcess.stdout.on("data", (data) => {
      console.log(data.toString().trim());
      
      // 檢查服務器啟動成功
      if (data.includes("http://localhost:3000")) {
        console.log("\n" + "=".repeat(50));
        console.log("🎉 Nightasaur 遊戲系統啟動成功！");
        console.log("=".repeat(50));
        console.log("\n🌐 訪問以下 URL：");
        console.log("  • 主界面: http://localhost:3000");
        console.log("  • API 文檔: http://localhost:3000/api/health");
        console.log("\n📱 可用 API 端點：");
        console.log("  • 遊戲系統: http://localhost:3000/api/game");
        console.log("  • 益智系統: http://localhost:3000/api/puzzles");
        console.log("  • 小隊系統: http://localhost:3000/api/squads");
        console.log("  • AR 探索: http://localhost:3000/api/ar");
        console.log("  • 語言設定: http://localhost:3000/api/language");
        console.log("\n⚙️  系統功能：");
        console.log("  • 益智升級系統 ✓");
        console.log("  • 隨從小隊系統 ✓");
        console.log("  • AR 位置探索 ✓");
        console.log("  • 多語言設定 ✓");
        console.log("\n🛑 停止服務器：按 Ctrl + C");
        console.log("=".repeat(50));
        
        resolve(serverProcess);
      }
    });
    
    serverProcess.stderr.on("data", (data) => {
      console.error("服務器錯誤:", data.toString().trim());
    });
    
    serverProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`服務器退出，代碼: ${code}`));
      }
    });
  });
}

async function openBrowser() {
  console.log("\n🌐 嘗試打開瀏覽器...");
  
  try {
    // 動態導入 open 模組
    const { default: open } = await import("open");
    await open("http://localhost:3000");
    console.log("✅ 瀏覽器已打開");
  } catch (error) {
    console.log("ℹ️  請手動打開瀏覽器訪問: http://localhost:3000");
  }
}

async function main() {
  console.log("🎮 Nightasaur 遊戲系統 - 本地啟動程序");
  console.log("=".repeat(50));
  
  try {
    // 1. 檢查環境
    if (!await checkEnvironment()) {
      process.exit(1);
    }
    
    // 2. 安裝依賴
    if (!await installDependencies()) {
      process.exit(1);
    }
    
    // 3. 設定資料庫
    if (!await setupDatabase()) {
      console.log("⚠️  資料庫設定有問題，繼續啟動...");
    }
    
    // 4. 測試系統
    if (!await testSystem()) {
      console.log("⚠️  系統測試有問題，繼續啟動...");
    }
    
    // 5. 啟動服務器
    const serverProcess = await startServer();
    
    // 6. 打開瀏覽器
    setTimeout(openBrowser, 3000);
    
    // 處理退出信號
    process.on("SIGINT", () => {
      console.log("\n🛑 正在停止服務器...");
      serverProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error("❌ 啟動失敗:", error.message);
    process.exit(1);
  }
}

// 執行主程序
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };