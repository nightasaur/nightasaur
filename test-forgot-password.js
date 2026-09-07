// 簡單測試忘記密碼功能
console.log("🧪 測試忘記密碼功能...");

const BASE_URL = "http://localhost:3002";

async function testForgotPassword() {
  console.log("\n1. 測試忘記密碼請求...");
  
  try {
    // 請求重置連結
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@nightasaur.com" })
    });
    
    const data = await res.json();
    console.log("✅ 請求結果:", data.message);
    
    if (data.resetLink) {
      console.log("🔗 重置連結:", data.resetLink);
      
      // 從連結中提取令牌
      const token = data.resetLink.split('token=')[1];
      
      console.log("\n2. 測試重置密碼...");
      
      const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          newPassword: "newpassword123"
        })
      });
      
      const resetData = await resetRes.json();
      console.log("✅ 重置結果:", resetData.message);
      
      console.log("\n3. 測試新密碼登入...");
      
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@nightasaur.com",
          password: "newpassword123"
        })
      });
      
      const loginData = await loginRes.json();
      console.log("✅ 登入結果:", loginData.message);
      
      // 改回原密碼以便後續測試
      console.log("\n4. 改回原密碼...");
      await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@nightasaur.com" })
      });
      
    }
    
  } catch (error) {
    console.error("❌ 測試失敗:", error.message);
  }
}

// 檢查服務器是否運行
async function checkServer() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    console.log("✅ 服務器狀態:", data.status);
    console.log("📧 支援信箱:", data.supportEmail);
    return true;
  } catch (error) {
    console.log("❌ 服務器未運行，請先啟動服務器");
    console.log("💡 運行: cd apps/backend && npx tsx auth-server.ts");
    return false;
  }
}

async function main() {
  console.log("🦖 Nightasaur 忘記密碼功能測試");
  console.log("=================================");
  
  const serverOk = await checkServer();
  if (serverOk) {
    await testForgotPassword();
  }
}

main();