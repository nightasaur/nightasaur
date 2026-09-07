// 模擬前端 API 調用測試
import axios from 'axios';

async function testFrontendApiCall() {
  console.log('=== 模擬前端 API 調用測試 ===\n');

  const API_BASE = 'http://localhost:3001'; // 假設後端運行在 3001 端口
  const testUser = {
    email: 'test@nightasaur.com',
    password: 'testpassword' // 這是假設的密碼
  };

  try {
    // 1. 首先登入獲取令牌
    console.log('1. 嘗試登入獲取令牌...');
    let token = '';
    
    try {
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      if (loginResponse.data.token) {
        token = loginResponse.data.token;
        console.log(`   ✅ 登入成功，獲取到令牌: ${token.substring(0, 30)}...`);
      }
    } catch (loginError: any) {
      console.log(`   ⚠️ 登入失敗: ${loginError.message}`);
      console.log('   使用預設令牌進行測試...');
      
      // 如果登入失敗，使用我們已知的有效使用者生成令牌
      // 這需要導入 jwt 庫，我們先跳過
    }
    
    // 2. 測試創建精靈
    console.log('\n2. 測試創建精靈 API...');
    
    const spiritData = {
      name: `前端測試精靈_${Date.now()}`,
      element: 'WATER',
      personality: '前端測試',
      appearance: '藍色水精靈'
    };
    
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const createResponse = await axios.post(
        `${API_BASE}/api/spirits`,
        spiritData,
        { headers }
      );
      
      console.log(`   ✅ 創建精靈成功:`, createResponse.data);
      console.log(`      精靈名稱: ${createResponse.data.name}`);
      console.log(`      精靈 ID: ${createResponse.data.id}`);
      console.log(`      使用者 ID: ${createResponse.data.userId}`);
      
    } catch (createError: any) {
      console.log(`   ❌ 創建精靈失敗: ${createError.message}`);
      
      if (createError.response) {
        console.log(`      狀態碼: ${createError.response.status}`);
        console.log(`      錯誤訊息: ${JSON.stringify(createError.response.data)}`);
        
        // 檢查是否是外鍵約束錯誤
        if (createError.response.data.error && 
            createError.response.data.error.includes('foreign key')) {
          console.log('\n   🔍 診斷外鍵錯誤:');
          console.log('      - 可能原因: 令牌中的 userId 不存在');
          console.log('      - 可能原因: 使用者未正確認證');
          console.log('      - 可能原因: 前端沒有發送認證令牌');
        }
      }
    }
    
    // 3. 測試獲取精靈列表
    console.log('\n3. 測試獲取精靈列表 API...');
    
    try {
      const listResponse = await axios.get(
        `${API_BASE}/api/spirits`,
        { headers }
      );
      
      console.log(`   ✅ 獲取精靈列表成功`);
      console.log(`      精靈數量: ${listResponse.data.length}`);
      
    } catch (listError: any) {
      console.log(`   ❌ 獲取精靈列表失敗: ${listError.message}`);
    }
    
    // 4. 檢查常見問題
    console.log('\n4. 常見問題檢查:');
    console.log('   a) 前端是否正確設置 Authorization 標頭?');
    console.log('      - 應為: Authorization: Bearer <token>');
    console.log('   b) 令牌是否有效且未過期?');
    console.log('   c) 後端是否正確解析令牌?');
    console.log('   d) authMiddleware 是否正確設置 req.user?');
    
  } catch (error: any) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  }
  
  console.log('\n=== 測試完成 ===');
}

// 運行測試
testFrontendApiCall();