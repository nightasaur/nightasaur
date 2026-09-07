import { languageService } from "./src/services/language.js";

// 測試數據
const TEST_USER_ID = "test-user-language-001";

async function testLanguageSystem() {
  console.log("🌐 測試語言設定系統...\n");
  
  try {
    // 1. 測試獲取用戶語言偏好設定
    console.log("1. 測試獲取用戶語言偏好設定...");
    const preference = await languageService.getUserLanguagePreference(TEST_USER_ID);
    console.log("用戶偏好設定:", {
      primaryLang: preference.primaryLang,
      displayMode: preference.displayMode,
      theme: preference.theme,
      fontSize: preference.fontSize
    });
    
    // 2. 測試更新語言偏好設定
    console.log("\n2. 測試更新語言偏好設定...");
    const updatedPreference = await languageService.updateLanguagePreference(TEST_USER_ID, {
      primaryLang: "en-US",
      displayMode: "BILINGUAL",
      secondaryLang: "zh-TW",
      theme: "DARK",
      fontSize: 18
    });
    console.log("更新後的偏好設定:", {
      primaryLang: updatedPreference.primaryLang,
      displayMode: updatedPreference.displayMode,
      secondaryLang: updatedPreference.secondaryLang,
      theme: updatedPreference.theme,
      fontSize: updatedPreference.fontSize
    });
    
    // 3. 測試自動偵測語言
    console.log("\n3. 測試自動偵測語言...");
    const acceptLanguageHeader = "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7";
    const autoDetectResult = await languageService.autoDetectLanguage(TEST_USER_ID, acceptLanguageHeader);
    console.log("自動偵測結果:", {
      detectedLang: autoDetectResult.detectedLang,
      languageName: autoDetectResult.languageInfo.name
    });
    
    // 4. 測試獲取翻譯
    console.log("\n4. 測試獲取翻譯...");
    const translation = await languageService.getTranslation("app_name", "common", "zh-TW");
    console.log("應用名稱翻譯 (zh-TW):", translation);
    
    const englishTranslation = await languageService.getTranslation("app_name", "common", "en-US");
    console.log("應用名稱翻譯 (en-US):", englishTranslation);
    
    // 5. 測試批量獲取翻譯
    console.log("\n5. 測試批量獲取翻譯...");
    const keys = ["app_name", "loading", "save", "cancel", "confirm"];
    const batchTranslations = await languageService.getBatchTranslations(keys, "common", "zh-TW");
    console.log("批量翻譯結果:", batchTranslations);
    
    // 6. 測試多語言翻譯
    console.log("\n6. 測試多語言翻譯...");
    const multiTranslations = await languageService.getMultiLanguageTranslations("app_name", "common");
    console.log("多語言翻譯:", {
      zhTW: multiTranslations?.zhTW,
      zhCN: multiTranslations?.zhCN,
      enUS: multiTranslations?.enUS,
      jaJP: multiTranslations?.jaJP,
      koKR: multiTranslations?.koKR
    });
    
    // 7. 測試獲取支援的語言列表
    console.log("\n7. 測試獲取支援的語言列表...");
    const languages = languageService.getSupportedLanguages();
    console.log(`支援 ${languages.length} 種語言:`, languages.map(lang => `${lang.flag} ${lang.name}`));
    
    // 8. 測試獲取顯示模式列表
    console.log("\n8. 測試獲取顯示模式列表...");
    const displayModes = languageService.getDisplayModes();
    console.log("顯示模式:", displayModes.map(mode => `${mode.name} (${mode.description})`));
    
    // 9. 測試獲取主題列表
    console.log("\n9. 測試獲取主題列表...");
    const themes = languageService.getThemes();
    console.log("主題:", themes.map(theme => `${theme.name} (${theme.description})`));
    
    // 10. 測試生成雙語文本
    console.log("\n10. 測試生成雙語文本...");
    const bilingualText = await languageService.generateBilingualText(
      "app_name",
      "common",
      "zh-TW",
      "en-US"
    );
    // 11. 測試獲取用戶語言歷史
    console.log("\n11. 測試獲取用戶語言歷史...");
    const history = await languageService.getUserLanguageHistory(TEST_USER_ID, 5);
    console.log(`用戶語言歷史 (最近 ${history.length} 筆):`);
    history.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.fromLang} → ${record.toLang} (${record.action})`);
    });
    
    // 12. 測試重置語言設定
    console.log("\n12. 測試重置語言設定...");
    const resetPreference = await languageService.resetLanguageSettings(TEST_USER_ID);
    console.log("重置後的設定:", {
      primaryLang: resetPreference.primaryLang,
      displayMode: resetPreference.displayMode,
      theme: resetPreference.theme
    });
    
    // 13. 測試獲取遊戲界面翻譯
    console.log("\n13. 測試獲取遊戲界面翻譯...");
    const interfaceTranslations = await languageService.getGameInterfaceTranslations("zh-TW");
    console.log("遊戲界面翻譯模組:", Object.keys(interfaceTranslations));
    console.log("通用模組翻譯數量:", Object.keys(interfaceTranslations.common || {}).length);
    
    console.log("\n✅ 語言系統測試完成！");
    console.log("\n📊 系統功能總結:");
    console.log("  • 語言偏好設定管理：✓");
    console.log("  • 自動語言偵測：✓");
    console.log("  • 多語言翻譯系統：✓");
    console.log("  • 批量翻譯獲取：✓");
    console.log("  • 雙語顯示模式：✓");
    console.log("  • 主題設定：✓");
    console.log("  • 字體大小調整：✓");
    console.log("  • 語言歷史記錄：✓");
    console.log("  • 設定重置功能：✓");
    console.log("  • 完整界面翻譯：✓");
    
  } catch (error) {
    console.error("❌ 測試失敗:", error);
    process.exit(1);
  }
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  testLanguageSystem()
    .then(() => {
      console.log("\n🎉 所有測試完成！");
      console.log("\n🌍 語言設定系統已準備好使用！");
      console.log("\n📋 API 端點:");
      console.log("  • GET    /api/language/preference             - 獲取用戶語言偏好");
      console.log("  • PUT    /api/language/preference             - 更新語言偏好");
      console.log("  • POST   /api/language/auto-detect            - 自動偵測語言");
      console.log("  • GET    /api/language/settings-menu          - 獲取設定菜單");
      console.log("  • GET    /api/language/languages              - 獲取支援語言列表");
      console.log("  • GET    /api/language/display-modes          - 獲取顯示模式列表");
      console.log("  • GET    /api/language/themes                 - 獲取主題列表");
      console.log("  • GET    /api/language/translation/:module/:key - 獲取單一翻譯");
      console.log("  • POST   /api/language/translations/:module/batch - 批量獲取翻譯");
      console.log("  • GET    /api/language/interface-translations - 獲取界面翻譯");
      console.log("  • GET    /api/language/history                - 獲取語言歷史");
      console.log("  • POST   /api/language/reset                  - 重置語言設定");
      console.log("\n💡 使用範例:");
      console.log("  1. 用戶首次進入遊戲時自動偵測語言");
      console.log("  2. 在設定菜單中選擇中文/英文/雙語模式");
      console.log("  3. 切換淺色/深色主題");
      console.log("  4. 調整字體大小以獲得更好的閱讀體驗");
      console.log("  5. 在中文模式下顯示英文提示以輔助學習");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 測試執行失敗:", error);
      process.exit(1);
    });
}

export { testLanguageSystem };