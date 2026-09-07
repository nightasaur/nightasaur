// 登入測試腳本
async function testLogin() {
  console.log('=== Nightasaur 登入系統測試 ===');
  
  try {
    // 測試健康檢查
    console.log('1. 測試服務器健康狀態...');
    const healthRes = await fetch('http://localhost:3002/api/health');
    const healthData = await healthRes.json();
    console.log(`   ✅ 服務器狀態: ${healthData.status}`);
    console.log(`   ✅ 服務: ${healthData.service}`);
    
    // 測試管理員登入
    console.log('2. 測試管理員登入...');
    const loginRes = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nightasaur.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginRes.json();
    if (loginData.success) {
      console.log(`   ✅ 登入成功！`);
      console.log(`     用戶名: ${loginData.user.username}`);
      console.log(`     角色: ${loginData.user.role}`);
      console.log(`     令牌: ${loginData.token.substring(0, 20)}...`);
    } else {
      console.log(`   ❌ 登入失敗: ${loginData.message}`);
    }
    
    // 測試錯誤密碼
    console.log('3. 測試錯誤密碼...');
    const wrongRes = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nightasaur.com',
        password: 'wrongpassword'
      })
    });
    
    const wrongData = await wrongRes.json();
    if (!wrongData.success) {
      console.log(`   ✅ 錯誤密碼測試成功: ${wrongData.message}`);
    } else {
      console.log(`   ❌ 錯誤密碼測試失敗`);
    }
    
    // 測試註冊功能
    console.log('4. 測試註冊新用戶...');
    const testEmail = `test${Date.now()}@nightasaur.com`;
    const testUsername = `testuser${Date.now()}`;
    
    const registerRes = await fetch('http://localhost:3002/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        username: testUsername,
        password: 'test123'
      })
    });
    
    const registerData = await registerRes.json();
    if (registerData.success) {
      console.log(`   ✅ 註冊成功！`);
      console.log(`     新用戶: ${registerData.user.email}`);
      console.log(`     用戶名: ${registerData.user.username}`);
    } else {
      console.log(`   ❌ 註冊失敗: ${registerData.message}`);
    }
    
    console.log('\n=== 測試完成 ===');
    console.log('✅ 所有測試通過！');
    console.log('\n現在您可以:');
    console.log('1. 訪問 http://localhost:3002 進行網頁測試');
    console.log('2. 使用管理員帳號: admin@nightasaur.com / admin123');
    console.log('3. 測試註冊新用戶功能');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    console.log('\n可能原因:');
    console.log('1. 服務器未啟動 - 請運行: npx tsx test-login-server.ts');
    console.log('2. 端口被佔用 - 請檢查端口3002');
    console.log('3. 網絡連接問題');
  }
}

// 運行測試
testLogin();