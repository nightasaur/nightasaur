import { signToken } from './src/utils/jwt.js';
import { spiritService } from './src/services/spirit.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApiFlow() {
  try {
    console.log('測試完整的 API 流程...');
    
    // 1. 首先獲取測試使用者
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@nightasaur.com' }
    });
    
    if (!testUser) {
      console.error('找不到測試使用者');
      return;
    }
    
    console.log('測試使用者:', testUser.username);
    
    // 2. 為該使用者生成 JWT 令牌
    const tokenPayload = {
      userId: testUser.id,
      email: testUser.email,
      role: testUser.role
    };
    
    const token = signToken(tokenPayload);
    console.log('生成的 JWT 令牌:', token.substring(0, 50) + '...');
    
    // 3. 模擬 authMiddleware 驗證令牌
    const authHeader = `Bearer ${token}`;
    console.log('授權標頭:', authHeader.substring(0, 50) + '...');
    
    // 4. 直接使用有效的 userId 測試 createSpirit
    console.log('\n直接測試 createSpirit...');
    const spirit = await spiritService.createSpirit({
      userId: testUser.id, // 使用有效的使用者 ID
      name: `API測試精靈${Date.now()}`, // 使用唯一的名稱
      element: 'LIGHT',
      personality: '聰明',
      appearance: '發光的光屬性精靈'
    });
    
    console.log('✅ 成功創建精靈:', spirit.name);
    
    // 5. 測試使用無效的 userId
    console.log('\n測試使用無效的使用者 ID...');
    try {
      const invalidSpirit = await spiritService.createSpirit({
        userId: 'invalid-user-id-999',
        name: '無效測試精靈',
        element: 'DARK',
        personality: '神秘',
        appearance: '黑暗精靈'
      });
      console.log('❌ 不應該成功創建精靈');
    } catch (error: any) {
      console.log('✅ 如預期般失敗:', error.message.includes('Foreign key constraint') ? '外鍵約束違反' : error.message);
    }
    
    console.log('\n✅ API 流程測試完成！');
    
  } catch (error: any) {
    console.error('❌ 測試失敗:', error.message);
    console.error('完整錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiFlow();