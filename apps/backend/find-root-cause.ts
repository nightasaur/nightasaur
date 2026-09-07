// 直接測試 createSpirit 問題的根源
import { spiritService } from './src/services/spirit.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findRootCause() {
  console.log('=== 查找外鍵約束問題的根本原因 ===\n');

  try {
    // 1. 模擬前端傳遞的 userId
    console.log('1. 測試不同的 userId 情況:');
    
    // 情況 A: 有效的 userId（從資料庫獲取）
    const validUser = await prisma.user.findFirst({
      where: { email: 'test@nightasaur.com' }
    });
    
    if (validUser) {
      console.log(`   A) 有效使用者: ${validUser.username} (ID: ${validUser.id})`);
      
      try {
        const spirit1 = await spiritService.createSpirit({
          userId: validUser.id,
          name: `有效測試_${Date.now()}`,
          element: 'FIRE',
          personality: '測試',
          appearance: '測試精靈'
        });
        console.log(`      ✅ 成功創建精靈: ${spirit1.name}`);
      } catch (error: any) {
        console.log(`      ❌ 失敗: ${error.message}`);
      }
    }
    
    // 情況 B: 無效的 userId
    console.log(`\n   B) 無效使用者 ID: 'invalid-user-id-123'`);
    try {
      const spirit2 = await spiritService.createSpirit({
        userId: 'invalid-user-id-123',
        name: `無效測試_${Date.now()}`,
        element: 'WATER',
        personality: '測試',
        appearance: '測試精靈'
      });
      console.log(`      ❌ 不應該成功`);
    } catch (error: any) {
      console.log(`      ✅ 預期失敗: ${error.message}`);
    }
    
    // 情況 C: 格式正確但不存在的 userId
    console.log(`\n   C) 格式正確但不存在的使用者 ID: 'cl0000000000000000000000000'`);
    try {
      const spirit3 = await spiritService.createSpirit({
        userId: 'cl0000000000000000000000000',
        name: `不存在測試_${Date.now()}`,
        element: 'LIGHT',
        personality: '測試',
        appearance: '測試精靈'
      });
      console.log(`      ❌ 不應該成功`);
    } catch (error: any) {
      console.log(`      ✅ 預期失敗: ${error.message}`);
    }
    
    console.log('\n2. 檢查前端可能傳遞的 userId:');
    console.log('   - 前端可能傳遞了空字符串: ""');
    console.log('   - 前端可能傳遞了 null 或 undefined');
    console.log('   - 前端可能傳遞了錯誤的 JWT 令牌');
    console.log('   - 前端可能沒有發送認證令牌');
    
    console.log('\n3. 檢查 authMiddleware 如何設置 req.user:');
    console.log('   - 檢查令牌是否有效');
    console.log('   - 檢查令牌是否包含正確的 userId');
    console.log('   - 檢查 req.user 是否正確設置');
    
    console.log('\n4. 實際解決方案:');
    console.log('   a) 在 spiritService.createSpirit 中添加使用者存在檢查:');
    console.log('      ```javascript');
    console.log('      const user = await prisma.user.findUnique({ where: { id: p.userId } });');
    console.log('      if (!user) throw new Error(`使用者不存在 (ID: ${p.userId})`);');
    console.log('      ```');
    
    console.log('\n   b) 在前端確保正確發送認證令牌:');
    console.log('      ```javascript');
    console.log('      headers: {');
    console.log('        \'Authorization\': `Bearer ${localStorage.getItem(\'token\')}`,');
    console.log('        \'Content-Type\': \'application/json\'');
    console.log('      }');
    console.log('      ```');
    
    console.log('\n   c) 檢查後端 authMiddleware:');
    console.log('      - 確保正確解析 JWT 令牌');
    console.log('      - 確保 req.user 包含正確的 userId');
    
  } catch (error: any) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== 測試完成 ===');
  }
}

findRootCause();