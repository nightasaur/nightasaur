// 測試特定 email 是否已註冊
const testEmail = "khh16813@gmail.com";
const testUsername = "jesus";
const testPassword = "Jesus16813";

const registerData = {
  email: testEmail,
  username: testUsername,
  password: testPassword
};

console.log("測試註冊 khh16813@gmail.com...");
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
    console.log("錯誤訊息:", data.message || data.error || data);
    
    // 測試登入看看是否已經註冊
    console.log("\n嘗試登入測試...");
    const loginResponse = await fetch('https://backend-production-5446.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const loginData = await loginResponse.json();
    console.log("登入狀態碼:", loginResponse.status);
    console.log("登入回應:", JSON.stringify(loginData, null, 2));
  }
} catch (error) {
  console.log("❌ 請求失敗:", error.message);
}