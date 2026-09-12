// 測試刪除精靈功能
async function testDeleteSpirit() {
  const email = "khh16813@gmail.com";
  const password = "Jesus16813";

  console.log("測試刪除精靈功能...");

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
    
    // 2. 獲取用戶的精靈列表
    console.log("\n2. 獲取精靈列表...");
    const spiritsResponse = await fetch('https://backend-production-5446.up.railway.app/api/spirits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const spiritsData = await spiritsResponse.json();
    
    if (!spiritsResponse.ok) {
      console.log("❌ 獲取精靈列表失敗:", spiritsData.message || spiritsData.error);
      return;
    }

    console.log(`✅ 找到 ${spiritsData.length} 個精靈`);
    
    if (spiritsData.length === 0) {
      console.log("⚠️ 用戶沒有精靈，無法測試刪除功能");
      return;
    }

    // 顯示精靈列表
    spiritsData.forEach((spirit, index) => {
      console.log(`  ${index + 1}. ${spirit.name} (${spirit.element}) - ID: ${spirit.id}`);
    });

    // 3. 測試刪除第一個精靈
    const spiritToDelete = spiritsData[0];
    console.log(`\n3. 測試刪除精靈: ${spiritToDelete.name}`);
    console.log("   ID:", spiritToDelete.id);
    
    const deleteResponse = await fetch(`https://backend-production-5446.up.railway.app/api/spirits/${spiritToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const deleteResult = await deleteResponse.json();
    
    if (deleteResponse.ok) {
      console.log("✅ 刪除成功!");
      console.log("回應:", JSON.stringify(deleteResult, null, 2));
    } else {
      console.log("❌ 刪除失敗!");
      console.log("錯誤:", deleteResult.message || deleteResult.error);
    }

    // 4. 再次獲取精靈列表確認
    console.log("\n4. 確認刪除結果...");
    const spiritsResponse2 = await fetch('https://backend-production-5446.up.railway.app/api/spirits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const spiritsData2 = await spiritsResponse2.json();
    
    if (spiritsResponse2.ok) {
      console.log(`✅ 刪除後還有 ${spiritsData2.length} 個精靈`);
      if (spiritsData2.length < spiritsData.length) {
        console.log("🎉 刪除功能正常運作!");
      } else {
        console.log("⚠️ 精靈數量沒有減少，可能是軟刪除");
      }
    }
    
  } catch (error) {
    console.log("❌ 請求失敗:", error.message);
  }
}

// 執行測試
testDeleteSpirit();