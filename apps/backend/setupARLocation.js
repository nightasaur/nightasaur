import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function setupARLocationSystem() {
  console.log("🚀 設定 AR 位置探索系統...");
  
  try {
    // 1. 運行資料庫遷移
    console.log("1. 運行資料庫遷移...");
    await execAsync("npx prisma migrate deploy");
    
    // 2. 生成 Prisma 客戶端
    console.log("2. 生成 Prisma 客戶端...");
    await execAsync("npx prisma generate");
    
    // 3. 載入熱點種子數據
    console.log("3. 載入熱點種子數據...");
    await execAsync("node prisma/seedHotspots.js");
    
    // 4. 啟動測試
    console.log("4. 測試 AR 位置系統...");
    await execAsync("node testARLocationSystem.js");
    
    console.log("\n✅ AR 位置探索系統設定完成！");
    console.log("\n📱 系統已準備好使用！");
    console.log("\n🌐 可用端點：");
    console.log("  • http://localhost:3000/api/ar/location");
    console.log("  • http://localhost:3000/api/ar/spawns/nearby");
    console.log("  • http://localhost:3000/api/ar/hotspots/nearby");
    console.log("  • http://localhost:3000/api/ar/visit");
    console.log("  • http://localhost:3000/api/ar/capture");
    console.log("  • http://localhost:3000/api/ar/route");
    console.log("  • http://localhost:3000/api/ar/stats");
    
  } catch (error) {
    console.error("❌ 設定失敗:", error);
    process.exit(1);
  }
}

// 執行設定
if (import.meta.url === `file://${process.argv[1]}`) {
  setupARLocationSystem()
    .then(() => {
      console.log("\n🎉 AR 位置探索系統已成功部署！");
      console.log("\n📖 詳細文件請參考：AR_LOCATION_SYSTEM_GUIDE.md");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 部署失敗:", error);
      process.exit(1);
    });
}

export { setupARLocationSystem };