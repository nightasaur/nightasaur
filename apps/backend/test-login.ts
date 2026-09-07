import axios from 'axios';

async function testLogin() {
  console.log('=== 測試登入功能 ===\n');

  const API_BASE = 'http://localhost:3002'; // 使用新的端口 3002
  
  // 測試帳號
  const testAccounts = [
    { email: 'admin@nightasaur.com', password: 'admin123!', description: '管理員帳號' },
    { email: 'demo@nightasaur.com', password: 'demo1234', description: '示範帳號' },
    { email: 'test@nightasaur.com', password: 'testpassword', description: '測試帳號' }
  ];

  for (const account of testAccounts) {
    console.log(`測試 ${account.description}:`);
    console.log(`  Email: ${account.email}`);
    console.log(`  密碼: ${account.password}`);
    
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: account.email,
        password: account.password
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      if (response.data.token && response.data.user) {
        console.log(`  ✅ 登入成功！`);
        console.log(`     使用者: ${response.data.user.username}`);
        console.log(`     使用者 ID: ${response.data.user.id}`);
        console.log(`     角色: ${response.data.user.role}`);
        console.log(`     令牌: ${response.data.token.substring(0, 30)}...`);
        
        // 測試獲取使用者資料
        try {
          const profileResponse = await axios.get(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${response.data.token}` }
          });
          console.log(`     📊 使用者資料: ${profileResponse.data.username}`);
          console.log(`         精靈數量: ${profileResponse.data.spiritCount}`);
        } catch (profileError: any) {
          console.log(`     ⚠️ 無法獲取使用者資料: ${profileError.message}`);
        }
      } else {
        console.log(`  ⚠️ 登入成功但返回資料不完整`);
      }
    } catch (error: any) {
      console.log(`  ❌ 登入失敗: ${error.message}`);
      
      if (error.response) {
        console.log(`     狀態碼: ${error.response.status}`);
        console.log(`     錯誤訊息: ${JSON.stringify(error.response.data)}`);
        
        if (error.response.status === 401) {
          console.log(`     💡 建議: 檢查密碼是否正確`);
        } else if (error.response.status === 404) {
          console.log(`     💡 建議: 使用者不存在，檢查 email`);
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`     💡 建議: 後端伺服器未運行，請啟動後端`);
        console.log(`         運行: cd apps/backend && npm run dev`);
      }
    }
    
    console.log();
  }

  console.log('=== 測試完成 ===');
  console.log('\n如果所有測試都失敗，請檢查:');
  console.log('1. 後端伺服器是否運行在 http://localhost:3002');
  console.log('2. 資料庫中是否有預設帳號');
  console.log('3. 密碼是否正確（注意大小寫和特殊符號）');
}

// 執行測試
testLogin();