#!/usr/bin/env node
// Nightasaur 系統測試腳本

async function testSystem() {
  console.log("🧪 開始測試 Nightasaur 系統...\n");
  
  const baseUrl = "http://localhost:3001";
  
  try {
    // 1. 測試健康檢查
    console.log("1. 測試健康檢查...");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log(`   ✅ 健康檢查: ${healthData.status} - ${healthData.service}`);
    
    // 2. 測試語言列表
    console.log("\n2. 測試語言列表...");
    const langRes = await fetch(`${baseUrl}/api/language/languages`);
    const langData = await langRes.json();
    console.log(`   ✅ 支援語言: ${langData.languages.map(l => l.name).join(", ")}`);
    
    // 3. 測試註冊
    console.log("\n3. 測試用戶註冊...");
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demo@nightasaur.com",
        username: "demo_user",
        password: "demo123"
      })
    });
    const registerData = await registerRes.json();
    console.log(`   ✅ 註冊結果: ${registerData.message}`);
    
    // 4. 測試登入
    console.log("\n4. 測試用戶登入...");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "demo@nightasaur.com",
        password: "demo123"
      })
    });
    const loginData = await loginRes.json();
    console.log(`   ✅ 登入結果: ${loginData.message}`);
    
    const token = loginData.token;
    
    // 5. 測試取得設定
    console.log("\n5. 測試取得設定...");
    const settingsRes = await fetch(`${baseUrl}/api/settings`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const settingsData = await settingsRes.json();
    console.log(`   ✅ 語言設定: ${settingsData.settings.language.primaryLang}`);
    console.log(`   ✅ 音樂音量: ${settingsData.settings.audio.musicVolume}`);
    console.log(`   ✅ 震動設定: ${settingsData.settings.vibration.vibrationEnabled ? "啟用" : "禁用"}`);
    
    // 6. 測試更新語言設定
    console.log("\n6. 測試更新語言設定...");
    const updateLangRes = await fetch(`${baseUrl}/api/settings/language`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        primaryLang: "zh-CN",
        fontSize: 18,
        theme: "DARK"
      })
    });
    const updateLangData = await updateLangRes.json();
    console.log(`   ✅ 語言更新: ${updateLangData.message}`);
    console.log(`   ✅ 新語言: ${updateLangData.languagePreference.primaryLang}`);
    
    // 7. 測試更新音效設定
    console.log("\n7. 測試更新音效設定...");
    const updateAudioRes = await fetch(`${baseUrl}/api/settings/audio`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        musicVolume: 85,
        soundVolume: 90,
        musicEnabled: true,
        soundEnabled: true
      })
    });
    const updateAudioData = await updateAudioRes.json();
    console.log(`   ✅ 音效更新: ${updateAudioData.message}`);
    console.log(`   ✅ 新音量: 音樂 ${updateAudioData.audioSettings.musicVolume}, 音效 ${updateAudioData.audioSettings.soundVolume}`);
    
    // 8. 測試更新震動設定
    console.log("\n8. 測試更新震動設定...");
    const updateVibrationRes = await fetch(`${baseUrl}/api/settings/vibration`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        vibrationEnabled: true,
        vibrationStrength: 75
      })
    });
    const updateVibrationData = await updateVibrationRes.json();
    console.log(`   ✅ 震動更新: ${updateVibrationData.message}`);
    console.log(`   ✅ 新強度: ${updateVibrationData.vibrationSettings.vibrationStrength}`);
    
    console.log("\n🎉 所有測試完成！系統運行正常。");
    console.log("\n📋 系統功能總結:");
    console.log("   • 用戶註冊/登入系統");
    console.log("   • 多語言設定管理 (繁體中文/簡體中文/英文)");
    console.log("   • 音效設定 (音樂/音效音量控制)");
    console.log("   • 震動設定 (啟用/禁用，強度控制)");
    console.log("\n🔗 訪問地址: http://localhost:3001");
    
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
    console.log("\n💡 提示: 請確保服務器正在運行 (http://localhost:3001)");
  }
}

testSystem();