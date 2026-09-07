// 測試精靈服務
import { spiritService } from './src/services/spirit.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSpiritService() {
  try {
    console.log('開始測試精靈服務...');
    
    // 獲取測試使用者
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@nightasaur.com' }
    });
    
    if (!testUser) {
      console.error('找不到測試使用者');
      return;
    }
    
    console.log('測試使用者:', testUser.username);
    
    // 測試獲取使用者精靈
    const spirits = await spiritService.getUserSpirits(testUser.id);
    console.log('使用者精靈數量:', spirits.length);
    
    if (spirits.length > 0) {
      console.log('第一個精靈:', spirits[0].name);
    }
    
    // 測試創建新精靈
    const newSpirit = await spiritService.createSpirit({
      userId: testUser.id,
      name: '測試精靈',
      element: 'WATER',
      personality: '友善',
      appearance: '藍色的水屬性精靈'
    });
    
    console.log('新創建的精靈:', newSpirit.name);
    
    // 再次獲取使用者精靈
    const updatedSpirits = await spiritService.getUserSpirits(testUser.id);
    console.log('更新後的使用者精靈數量:', updatedSpirits.length);
    
    console.log('✅ 精靈服務測試成功！');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpiritService();