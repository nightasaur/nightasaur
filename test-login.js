// 測試登入功能的腳本
const fetch = require('node-fetch');

async function testLogin() {
  console.log('=== 測試 Nightasaur 登入功能 ===');
  
  try {
    // 測試服務器健康狀態
    console.log('1. 測試服務器健康狀態...');
    const healthRes = await fetch('http://localhost:3002/api/health');
    const healthData = await healthRes.json();
    console.log(`   狀態: ${healthRes.status} - ${healthData.status}`);
    
    // 測試登入
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
    console.log(`   狀態碼: ${loginRes.status}`);
    console.log(`   成功: ${loginData.success}`);
    console.log(`   訊息: ${loginData.message}`);
    
    if (loginData.success) {
      console.log(`   Token: ${loginData.token ? '已獲取' : '未獲取'}`);
    } else {
      console.log('   ❌ 登入失敗');
      console.log('   可能原因:');
      console.log('     - 管理員帳號不存在');
      console.log('     - 密碼錯誤');
      console.log('     - 數據庫沒有初始化');
    }
    
    // 測試註冊功能
    console.log('3. 測試註冊功能...');
    const registerRes = await fetch('http://localhost:3002/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@nightasaur.com',
        username: 'testuser',
        password: 'test123'
      })
    });
    
    const registerData = await registerRes.json();
    console.log(`   狀態碼: ${registerRes.status}`);
    console.log(`   成功: ${registerData.success}`);
    console.log(`   訊息: ${registerData.message}`);
    
    // 測試忘記密碼
    console.log('4. 測試忘記密碼功能...');
    const forgotRes = await fetch('http://localhost:3002/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nightasaur.com'
      })
    });
    
    const forgotData = await forgotRes.json();
    console.log(`   狀態碼: ${forgotRes.status}`);
    console.log(`   成功: ${forgotData.success}`);
    console.log(`   訊息: ${forgotData.message}`);
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    console.log('可能原因:');
    console.log('   - 服務器未運行');
    console.log('   - 端口被佔用');
    console.log('   - 網絡連接問題');
  }
}

// 運行測試
testLogin();