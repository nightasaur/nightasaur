// 測試註冊功能
const testEmail = `test${Date.now()}@test.com`;
const testUsername = `testuser${Date.now()}`;
const testPassword = "test123456";

const registerData = {
  email: testEmail,
  username: testUsername,
  password: testPassword
};

console.log("測試註冊功能...");
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
    console.log("精靈ID:", data.spirit?.id);
  } else {
    console.log("❌ 註冊失敗!");
    console.log("錯誤訊息:", data.message || data.error);
  }
} catch (error) {
  console.log("❌ 請求失敗:", error.message);
}