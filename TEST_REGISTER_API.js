#!/usr/bin/env node
/**
 * Nightasaur 註冊 API 測試腳本
 * 用於驗證資料庫連線切換與註冊功能
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const API_BASE = 'http://localhost:3002/api';
const TEST_EMAIL = `test_${Date.now()}@nightasaur.com`;
const TEST_USERNAME = `testuser_${Date.now().toString().slice(-6)}`;
const TEST_PASSWORD = 'Test123!@#';

async function testDatabaseConnection() {
  console.log('🔍 測試資料庫連線...');
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // 檢查 User 資料表
    const userCount = await prisma.user.count();
    console.log(`✅ 資料庫連線成功，使用者數量: ${userCount}`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ 資料庫連線失敗:', error.message);
    return false;
  }
}

async function testRegisterAPI() {
  console.log('\n🚀 測試註冊 API...');
  
  const testData = {
    email: TEST_EMAIL,
    username: TEST_USERNAME,
    password: TEST_PASSWORD
  };
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, testData, {
      timeout: 10000
    });
    
    console.log('📊 API 回應狀態:', response.status);
    console.log('📦 回應資料:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ 註冊 API 測試成功');
      console.log(`  模式: ${response.data.mode}`);
      console.log(`  Token: ${response.data.token ? '已取得' : '未取得'}`);
      console.log(`  精靈: ${response.data.spirit ? '已創建' : '未創建'}`);
      
      if (response.data.warning) {
        console.log(`  ⚠️  警告: ${response.data.warning}`);
      }
      
      return { success: true, data: response.data };
    } else {
      console.log('❌ 註冊 API 回傳失敗');
      return { success: false, data: response.data };
    }
    
  } catch (error) {
    console.error('❌ 註冊 API 請求失敗:');
    
    if (error.response) {
      console.log('  狀態碼:', error.response.status);
      console.log('  錯誤資料:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('  無回應:', error.message);
    } else {
      console.log('  請求錯誤:', error.message);
    }
    
    return { success: false, error: error.message };
  }
}

async function testDuplicateEmail() {
  console.log('\n🔁 測試重複 Email 註冊...');
  
  const testData = {
    email: TEST_EMAIL, // 使用剛才註冊的 Email
    username: `duplicate_${Date.now()}`,
    password: 'AnotherPass123!'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, testData, {
      timeout: 5000
    });
    
    console.log('❌ 重複註冊應該失敗但成功了');
    return false;
    
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ 重複 Email 註冊正確被拒絕');
      console.log('  錯誤訊息:', error.response.data.message);
      return true;
    } else {
      console.log('❌ 重複註冊測試失敗:', error.message);
      return false;
    }
  }
}

async function testInvalidData() {
  console.log('\n🚫 測試無效資料註冊...');
  
  const testCases = [
    {
      name: '無效 Email',
      data: { email: 'invalid-email', username: 'testuser', password: 'ValidPass123!' },
      expectedError: '有效的 Email'
    },
    {
      name: '密碼太短',
      data: { email: 'short@test.com', username: 'testuser', password: 'short' },
      expectedError: '8個字元'
    },
    {
      name: '缺少欄位',
      data: { email: '', username: '', password: '' },
      expectedError: '必填欄位'
    }
  ];
  
  let passed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n  測試: ${testCase.name}`);
    
    try {
      await axios.post(`${API_BASE}/auth/register`, testCase.data, {
        timeout: 5000
      });
      
      console.log('  ❌ 應該失敗但成功了');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || '';
      
      if (error.response?.status === 400 && 
          (testCase.expectedError === '' || errorMessage.includes(testCase.expectedError))) {
        console.log(`  ✅ 正確拒絕無效資料: ${errorMessage}`);
        passed++;
      } else {
        console.log(`  ❌ 錯誤處理不正確: ${errorMessage}`);
      }
    }
  }
  
  console.log(`\n  📊 無效資料測試: ${passed}/${testCases.length} 通過`);
  return passed === testCases.length;
}

async function main() {
  console.log('🧪 Nightasaur 註冊 API 測試套件');
  console.log('====================================\n');
  
  console.log('📝 測試資訊:');
  console.log(`  API 端點: ${API_BASE}`);
  console.log(`  測試 Email: ${TEST_EMAIL}`);
  console.log(`  測試使用者名稱: ${TEST_USERNAME}`);
  console.log(`  環境: ${process.env.NODE_ENV || 'development'}`);
  
  // 測試 1: 資料庫連線
  const dbConnected = await testDatabaseConnection();
  
  // 測試 2: 正常註冊
  const registerResult = await testRegisterAPI();
  
  // 測試 3: 重複註冊（只有在第一次註冊成功時測試）
  let duplicateTestPassed = false;
  if (registerResult.success) {
    duplicateTestPassed = await testDuplicateEmail();
  }
  
  // 測試 4: 無效資料
  const invalidDataPassed = await testInvalidData();
  
  // 總結
  console.log('\n📋 測試總結');
  console.log('====================================');
  console.log(`1. 資料庫連線: ${dbConnected ? '✅ 通過' : '❌ 失敗'}`);
  console.log(`2. 正常註冊: ${registerResult.success ? '✅ 通過' : '❌ 失敗'}`);
  console.log(`3. 重複註冊檢查: ${duplicateTestPassed ? '✅ 通過' : '⚠️  跳過'}`);
  console.log(`4. 無效資料驗證: ${invalidDataPassed ? '✅ 通過' : '❌ 失敗'}`);
  
  if (registerResult.success && registerResult.data?.mode === 'memory') {
    console.log('\n⚠️  注意：系統運行在記憶體模式');
    console.log('   資料不會永久保存，請檢查資料庫連線設定');
  }
  
  const totalTests = 3 + (registerResult.success ? 1 : 0);
  const passedTests = [
    dbConnected,
    registerResult.success,
    duplicateTestPassed,
    invalidDataPassed
  ].filter(Boolean).length;
  
  console.log(`\n🎯 總計: ${passedTests}/${totalTests} 項測試通過`);
  
  if (passedTests === totalTests) {
    console.log('\n✅ 所有測試通過！註冊 API 功能正常');
    process.exit(0);
  } else {
    console.log('\n❌ 部分測試失敗，請檢查問題');
    process.exit(1);
  }
}

// 執行測試
main().catch(error => {
  console.error('❌ 測試執行失敗:', error);
  process.exit(1);
});