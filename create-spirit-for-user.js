// 為 khh16813@gmail.com 創建精靈
async function createSpiritForUser() {
  const email = "khh16813@gmail.com";
  const password = "Jesus16813";

  console.log("為 khh16813@gmail.com 創建精靈...");

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
    console.log("令牌:", loginData.token.substring(0, 20) + "...");
    
    const token = loginData.token;
    const userId = loginData.user.id;
    
    // 2. 檢查用戶是否已經有精靈
    console.log("\n2. 檢查用戶精靈...");
    const profileResponse = await fetch('https://backend-production-5446.up.railway.app/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const profileData = await profileResponse.json();
    
    if (profileResponse.ok) {
      console.log("✅ 獲取用戶資料成功");
      console.log("用戶名:", profileData.username);
      console.log("精靈數量:", profileData.spiritCount);
      
      if (profileData.spirits && profileData.spirits.length > 0) {
        console.log("🎉 用戶已有精靈:");
        profileData.spirits.forEach((spirit, index) => {
          console.log(`  ${index + 1}. ${spirit.name} (${spirit.element}) - ${spirit.stage} Lv.${spirit.level}`);
        });
      } else {
        console.log("⚠️ 用戶還沒有精靈，現在創建一個...");
        
        // 3. 創建精靈
        const spiritData = {
          userId: userId,
          name: `jesus的初始精靈`,
          element: "LIGHT", // 使用光元素
          personality: "神聖而溫暖，充滿智慧與慈悲",
          appearance: "散發著柔和光芒的神聖生物",
          species: "神聖精靈"
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
        } else {
          console.log("❌ 精靈創建失敗:", spiritResult.message || spiritResult.error);
        }
      }
    } else {
      console.log("❌ 獲取用戶資料失敗:", profileData.message || profileData.error);
    }
    
  } catch (error) {
    console.log("❌ 請求失敗:", error.message);
  }
}

// 執行函數
createSpiritForUser();