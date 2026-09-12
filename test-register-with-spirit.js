// 測試新的註冊功能（帶精靈創建）
const testEmail = `test${Date.now()}@nightasaur.com`;
const testUsername = `nightuser${Date.now()}`;
const testPassword = "test123456";

const registerData = {
  email: testEmail,
  username: testUsername,
  password: testPassword
};

console.log("測試新的註冊功能（帶精靈創建）...");
console.log("註冊資料:", JSON.stringify(registerData, null, 2));

try {
  const response = await fetch('https://backend-production-5446.up.railway.app/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registerData)
  });

  const data = await response.json();
  console.log("狀態碼:", response.status);
  console.log("回應資料:", JSON.stringify(data, null, 2));
  
  if (response.ok) {
    console.log("✅ 註冊成功!");
    console.log("用戶ID:", data.user?.id || data.id);
    console.log("用戶名:", data.user?.username);
    console.log("令牌長度:", data.token?.length || 0);
    
    if (data.spirit) {
      console.log("🎉 精靈創建成功!");
      console.log("精靈ID:", data.spirit.id);
      console.log("精靈名稱:", data.spirit.name);
      console.log("精靈元素:", data.spirit.element);
      console.log("精靈階段:", data.spirit.stage);
      console.log("精靈等級:", data.spirit.level);
    } else {
      console.log("⚠️ 沒有精靈數據返回");
    }
  } else {
    console.log("❌ 註冊失敗!");
    console.log("錯誤訊息:", data.message || data.error || data);
  }
} catch (error) {
  console.log("❌ 請求失敗:", error.message);
}