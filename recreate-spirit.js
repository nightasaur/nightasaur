// 為 khh16813@gmail.com 重新創建精靈
async function recreateSpirit() {
  const email = "khh16813@gmail.com";
  const password = "Jesus16813";

  console.log("為 khh16813@gmail.com 重新創建精靈...");

  try {
    // 1. 先登入獲取令牌
    console.log("1. 登入獲取令牌...");
    const loginResponse = await fetch('https://backend-production-5446.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log("❌ 登入失敗:", loginData.message || loginData.error);
      return;
    }

    console.log("✅ 登入成功!");
    console.log("用戶ID:", loginData.user.id);
    
    const token = loginData.token;
    const userId = loginData.user.id;
    
    // 2. 創建新的精靈
    console.log("\n2. 創建新的精靈...");
    const spiritData = {
      name: `jesus的新精靈`,
      element: "STAR", // 使用星元素
      personality: "神秘而智慧，充滿宇宙能量",
      appearance: "散發著星光的宇宙生物",
      species: "星際精靈"
    };
    
    const spiritResponse = await fetch('https://backend-production-5446.up.railway.app/api/spirits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(spiritData)
    });

    const spiritResult = await spiritResponse.json();
    
    if (spiritResponse.ok) {
      console.log("🎉 精靈創建成功!");
      console.log("精靈ID:", spiritResult.id);
      console.log("精靈名稱:", spiritResult.name);
      console.log("精靈元素:", spiritResult.element);
      console.log("精靈階段:", spiritResult.stage);
      console.log("精靈等級:", spiritResult.level);
      
      // 3. 提供測試信息
      console.log("\n3. 測試信息:");
      console.log("   網站: https://web-nightasaur.vercel.app");
      console.log("   帳號:", email);
      console.log("   密碼:", password);
      console.log("   精靈頁面: https://web-nightasaur.vercel.app/spirits/" + spiritResult.id);
      console.log("\n   現在您可以:");
      console.log("   1. 登入網站");
      console.log("   2. 查看您的精靈");
      console.log("   3. 點擊精靈進入詳細頁面");
      console.log("   4. 在頁面底部找到「🗑️ 刪除精靈」按鈕");
      console.log("   5. 測試刪除功能");
    } else {
      console.log("❌ 精靈創建失敗:", spiritResult.message || spiritResult.error);
    }
    
  } catch (error) {
    console.log("❌ 請求失敗:", error.message);
  }
}

// 執行函數
recreateSpirit();