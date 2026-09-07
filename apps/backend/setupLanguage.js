import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function setupLanguageSystem() {
  console.log("🌐 設定語言設定系統...");
  
  try {
    // 1. 運行資料庫遷移
    console.log("1. 運行資料庫遷移...");
    await execAsync("npx prisma migrate deploy");
    
    // 2. 生成 Prisma 客戶端
    console.log("2. 生成 Prisma 客戶端...");
    await execAsync("npx prisma generate");
    
    // 3. 載入翻譯種子數據
    console.log("3. 載入翻譯種子數據...");
    await execAsync("node prisma/seedTranslations.js");
    
    // 4. 啟動測試
    console.log("4. 測試語言系統...");
    await execAsync("node testLanguageSystem.js");
    
    console.log("\n✅ 語言設定系統設定完成！");
    console.log("\n🌍 系統已準備好使用！");
    console.log("\n📱 可用端點：");
    console.log("  • http://localhost:3000/api/language/preference");
    console.log("  • http://localhost:3000/api/language/settings-menu");
    console.log("  • http://localhost:3000/api/language/languages");
    console.log("  • http://localhost:3000/api/language/display-modes");
    console.log("  • http://localhost:3000/api/language/themes");
    console.log("  • http://localhost:3000/api/language/translation/common/app_name");
    console.log("  • http://localhost:3000/api/language/interface-translations");
    
    console.log("\n🎮 遊戲語言設定功能：");
    console.log("  • 支援 5 種語言：繁體中文、簡體中文、英文、日文、韓文");
    console.log("  • 3 種顯示模式：單一語言、雙語顯示、自動切換");
    console.log("  • 3 種主題：淺色、深色、自動");
    console.log("  • 字體大小調整：12-24px");
    console.log("  • 進階設定：羅馬拼音、拼音、英文提示");
    console.log("  • 自動語言偵測：根據瀏覽器設定");
    console.log("  • 完整的遊戲界面翻譯");
    
  } catch (error) {
    console.error("❌ 設定失敗:", error);
    process.exit(1);
  }
}

// 執行設定
if (import.meta.url === `file://${process.argv[1]}`) {
  setupLanguageSystem()
    .then(() => {
      console.log("\n🎉 語言設定系統已成功部署！");
      console.log("\n📖 用戶體驗流程：");
      console.log("  1. 用戶首次進入遊戲時，系統自動偵測語言");
      console.log("  2. 用戶可以在設定菜單中選擇喜歡的語言");
      console.log("  3. 可以選擇單一語言或雙語顯示模式");
      console.log("  4. 可以切換淺色/深色主題以適應不同環境");
      console.log("  5. 可以調整字體大小以獲得最佳閱讀體驗");
      console.log("  6. 在學習模式下，可以開啟拼音或英文提示");
      console.log("  7. 所有設定會自動保存並同步");
      console.log("\n🚀 開始您的多語言遊戲體驗吧！");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 部署失敗:", error);
      process.exit(1);
    });
}

export { setupLanguageSystem };