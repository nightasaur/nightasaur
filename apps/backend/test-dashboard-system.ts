// 測試儀表板和精靈創建系統
import axios from 'axios';

async function testDashboardAndSpiritCreation() {
  console.log('=== 測試儀表板和精靈創建系統 ===\n');

  const API_BASE = 'http://localhost:3002';
  const testAccount = {
    email: 'admin@nightasaur.com',
    password: 'admin123!'
  };

  let token = '';
  let userId = '';

  try {
    // 1. 登入獲取令牌
    console.log('1. 登入測試:');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, testAccount);
    
    token = loginResponse.data.token;
    userId = loginResponse.data.user.id;
    
    console.log(`   ✅ 登入成功`);
    console.log(`      使用者: ${loginResponse.data.user.username}`);
    console.log(`      使用者 ID: ${userId}`);
    console.log(`      令牌: ${token.substring(0, 30)}...`);
    console.log();

    // 2. 測試獲取使用者資料（儀表板API）
    console.log('2. 測試儀表板資料 (GET /api/auth/me):');
    try {
      const meResponse = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`   ✅ 獲取使用者資料成功`);
      console.log(`      使用者名稱: ${meResponse.data.username}`);
      console.log(`      精靈數量: ${meResponse.data.spiritCount}`);
      console.log(`      精靈列表: ${JSON.stringify(meResponse.data.spirits)}`);
      
      if (meResponse.data.spiritCount === 0) {
        console.log(`      💡 使用者沒有精靈，儀表板會顯示創建精靈提示`);
      }
    } catch (meError: any) {
      console.log(`   ❌ 獲取使用者資料失敗: ${meError.message}`);
      if (meError.response) {
        console.log(`      狀態碼: ${meError.response.status}`);
        console.log(`      錯誤訊息: ${JSON.stringify(meError.response.data)}`);
      }
    }
    console.log();

    // 3. 測試獲取精靈列表
    console.log('3. 測試精靈列表 API (GET /api/spirits):');
    try {
      const spiritsResponse = await axios.get(`${API_BASE}/api/spirits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`   ✅ 獲取精靈列表成功`);
      console.log(`      精靈數量: ${spiritsResponse.data.length}`);
      
      if (spiritsResponse.data.length > 0) {
        console.log(`      精靈列表:`);
        spiritsResponse.data.slice(0, 3).forEach((spirit: any, index: number) => {
          console.log(`      ${index + 1}. ${spirit.name} (${spirit.element}) - Lv.${spirit.level}`);
        });
      }
    } catch (spiritsError: any) {
      console.log(`   ❌ 獲取精靈列表失敗: ${spiritsError.message}`);
      if (spiritsError.response) {
        console.log(`      狀態碼: ${spiritsError.response.status}`);
        console.log(`      錯誤訊息: ${JSON.stringify(spiritsError.response.data)}`);
      }
    }
    console.log();

    // 4. 測試創建精靈
    console.log('4. 測試創建精靈 API (POST /api/spirits):');
    const spiritData = {
      name: `測試精靈_${Date.now()}`,
      element: 'FIRE',
      personality: '勇敢',
      appearance: '紅色火焰精靈'
    };
    
    try {
      const createResponse = await axios.post(`${API_BASE}/api/spirits`, spiritData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ 創建精靈成功`);
      console.log(`      精靈名稱: ${createResponse.data.name}`);
      console.log(`      精靈 ID: ${createResponse.data.id}`);
      console.log(`      元素: ${createResponse.data.element}`);
      console.log(`      階段: ${createResponse.data.stage}`);
      console.log(`      等級: ${createResponse.data.level}`);
    } catch (createError: any) {
      console.log(`   ❌ 創建精靈失敗: ${createError.message}`);
      if (createError.response) {
        console.log(`      狀態碼: ${createError.response.status}`);
        console.log(`      錯誤訊息: ${JSON.stringify(createError.response.data)}`);
        
        if (createError.response.status === 401) {
          console.log(`      💡 認證失敗，令牌可能無效`);
        } else if (createError.response.status === 404) {
          console.log(`      💡 使用者不存在問題`);
        }
      }
    }
    console.log();

    // 5. 再次檢查儀表板資料
    console.log('5. 再次檢查儀表板資料:');
    try {
      const meResponse2 = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`   ✅ 儀表板資料更新成功`);
      console.log(`      精靈數量: ${meResponse2.data.spiritCount}`);
      console.log(`      精靈列表: ${meResponse2.data.spirits.length} 隻`);
    } catch (meError2: any) {
      console.log(`   ❌ 儀表板資料更新失敗: ${meError2.message}`);
    }
    console.log();

    // 6. 診斷儀表板空白問題
    console.log('6. 儀表板空白問題診斷:');
    console.log('   可能原因:');
    console.log('   a) 前端 API 請求失敗（檢查瀏覽器控制台）');
    console.log('   b) 令牌未正確存儲在 localStorage');
    console.log('   c) 路由配置問題');
    console.log('   d) React 組件渲染問題');
    console.log();
    console.log('   檢查步驟:');
    console.log('   1. 打開瀏覽器開發者工具 (F12)');
    console.log('   2. 查看 Console 標籤的錯誤訊息');
    console.log('   3. 查看 Network 標籤的 API 請求');
    console.log('   4. 檢查 Application 標籤的 localStorage');
    console.log();
    console.log('   預期 localStorage 內容:');
    console.log('   - nightasaur_token: 應包含 JWT 令牌');
    console.log('   - nightasaur_user: 應包含使用者資料');

  } catch (error: any) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  }
  
  console.log('\n=== 測試完成 ===');
}

testDashboardAndSpiritCreation();