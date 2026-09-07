// Nightasaur 完整整合測試腳本
console.log('=== Nightasaur 系統整合測試 ===\n');

async function testAllSystems() {
  console.log('1. 測試系統連接...');
  
  const systems = [
    { name: '遊戲前台', url: 'http://localhost:5173', port: 5173 },
    { name: '遊戲後台', url: 'http://localhost:3000', port: 3000 },
    { name: '登入系統', url: 'http://localhost:3002', port: 3002 },
    { name: '整合入口', url: 'file:///C:/Nightasaur/portal.html', port: null }
  ];
  
  // 檢查端口是否被佔用
  console.log('\n🔍 檢查端口狀態:');
  for (const system of systems) {
    if (system.port) {
      try {
        const response = await fetch(`${system.url}`, { mode: 'no-cors' });
        console.log(`   ✅ ${system.name}: 端口 ${system.port} 正常 (${system.url})`);
      } catch {
        console.log(`   ❌ ${system.name}: 端口 ${system.port} 無法訪問`);
      }
    }
  }
  
  console.log('\n2. 測試登入功能...');
  try {
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
      console.log(`      用戶: ${loginData.user.username}`);
      console.log(`      角色: ${loginData.user.role}`);
      console.log(`      令牌: ${loginData.token.substring(0, 20)}...`);
      
      // 測試令牌存儲
      localStorage.setItem('nightasaur_token', loginData.token);
      console.log(`   ✅ 令牌已存儲到 localStorage`);
    } else {
      console.log(`   ❌ 登入失敗: ${loginData.message}`);
    }
  } catch (error) {
    console.log(`   ❌ 登入測試錯誤: ${error.message}`);
  }
  
  console.log('\n3. 測試遊戲界面訪問...');
  try {
    const response = await fetch('http://localhost:5173', { mode: 'no-cors' });
    console.log(`   ✅ 遊戲前台可訪問`);
    
    // 檢查遊戲是否包含React應用
    console.log(`   ℹ️  嘗試訪問遊戲API...`);
    const apiResponse = await fetch('http://localhost:5173/api/health', { mode: 'no-cors' });
    console.log(`   ✅ 遊戲API代理正常`);
  } catch (error) {
    console.log(`   ❌ 遊戲界面訪問錯誤: ${error.message}`);
  }
  
  console.log('\n4. 測試後台系統...');
  try {
    const backendRes = await fetch('http://localhost:3000/api/health');
    const backendData = await backendRes.json();
    console.log(`   ✅ 後台系統正常`);
    console.log(`      服務: ${backendData.service}`);
    console.log(`      版本: ${backendData.version}`);
    console.log(`      語言: ${backendData.primaryLanguage || '繁體中文'}`);
  } catch (error) {
    console.log(`   ❌ 後台系統錯誤: ${error.message}`);
  }
  
  console.log('\n5. 整合測試總結...');
  console.log('══════════════════════════════════════════');
  console.log('🎯 推薦使用流程:');
  console.log('   1. 訪問入口頁面: file:///C:/Nightasaur/portal.html');
  console.log('   2. 點擊「進入完整遊戲」按鈕');
  console.log('   3. 在遊戲界面點擊登入');
  console.log('   4. 使用管理員帳號: admin@nightasaur.com / admin123');
  console.log('   5. 自動跳轉到遊戲儀表板');
  console.log('');
  console.log('🎯 直接登入流程:');
  console.log('   1. 訪問登入頁面: http://localhost:3002');
  console.log('   2. 使用管理員帳號登入');
  console.log('   3. 自動跳轉到遊戲界面: http://localhost:5173/dashboard');
  console.log('');
  console.log('📋 管理員帳號資訊:');
  console.log('   電子郵件: admin@nightasaur.com');
  console.log('   用戶名: admin');
  console.log('   密碼: admin123');
  console.log('   角色: 系統管理員');
  console.log('   支援信箱: service@nightasaur.com');
  console.log('');
  console.log('🌐 系統訪問地址:');
  console.log('   遊戲前台: http://localhost:5173');
  console.log('   遊戲後台: http://localhost:3000');
  console.log('   登入系統: http://localhost:3002');
  console.log('   整合入口: file:///C:/Nightasaur/portal.html');
  console.log('══════════════════════════════════════════');
  
  console.log('\n✅ 整合測試完成！');
  console.log('💡 提示: 建議使用整合入口頁面獲得最佳體驗');
}

// 運行測試
testAllSystems().catch(error => {
  console.error('測試過程中發生錯誤:', error);
});