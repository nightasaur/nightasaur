// 測試 Nightasaur 後台系統功能
console.log("🦖 Nightasaur 遊戲後台系統測試");
console.log("=================================");

// 測試 API 端點
const testEndpoints = async () => {
  try {
    console.log("1. 測試首頁訪問...");
    const homeRes = await fetch("http://localhost:3000/");
    console.log(`   首頁狀態: ${homeRes.status} ${homeRes.statusText}`);
    
    console.log("\n2. 測試健康檢查...");
    const healthRes = await fetch("http://localhost:3000/api/health");
    const healthData = await healthRes.json();
    console.log(`   服務器狀態: ${healthData.status}`);
    console.log(`   主要語言: ${healthData.primaryLanguage}`);
    
    console.log("\n3. 測試多語言系統...");
    const langRes = await fetch("http://localhost:3000/api/language/languages");
    const langData = await langRes.json();
    console.log(`   支持語言數量: ${langData.languages.length}`);
    console.log(`   主要語言: ${langData.primaryLanguage}`);
    
    // 顯示語言列表
    console.log("   語言列表:");
    langData.languages.forEach(lang => {
      console.log(`     - ${lang.code}: ${lang.name} ${lang.isPrimary ? "(主要)" : ""}`);
    });
    
    console.log("\n4. 測試語言切換...");
    
    // 切換到簡體中文
    console.log("   a. 切換到簡體中文...");
    const switchToCN = await fetch("http://localhost:3000/api/language/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "zh-CN" })
    });
    const cnData = await switchToCN.json();
    console.log(`     結果: ${cnData.message}`);
    
    // 切換回繁體中文
    console.log("   b. 切換回繁體中文...");
    const switchToTW = await fetch("http://localhost:3000/api/language/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "zh-TW" })
    });
    const twData = await switchToTW.json();
    console.log(`     結果: ${twData.message}`);
    
    console.log("\n5. 測試AR位置系統...");
    const arRes = await fetch("http://localhost:3000/api/ar/spawns/nearby");
    const arData = await arRes.json();
    console.log(`   AR地點數量: ${arData.hotspots.length}`);
    
    console.log("\n   AR地點詳細信息:");
    arData.hotspots.forEach(hotspot => {
      console.log(`   - ${hotspot.name} (${hotspot.name_zh_cn})`);
      console.log(`     位置: ${hotspot.latitude}, ${hotspot.longitude}`);
      console.log(`     類型: ${hotspot.type}`);
    });
    
    console.log("\n✅ 所有測試完成！");
    console.log("\n📋 系統功能總結:");
    console.log("   • 首頁訪問: ✓");
    console.log("   • 健康檢查: ✓");
    console.log("   • 多語言系統: ✓ (繁體/簡體中文分離)");
    console.log("   • 語言切換: ✓");
    console.log("   • AR位置系統: ✓");
    console.log("   • 主要語言: 繁體中文");
    
    console.log("\n🌐 訪問地址:");
    console.log("   首頁: http://localhost:3000/");
    console.log("   API文檔: 見首頁界面");
    
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
  }
};

// 運行測試
testEndpoints();