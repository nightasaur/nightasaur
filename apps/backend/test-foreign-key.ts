import { spiritService } from './src/services/spirit.js';

async function testCreateSpiritError() {
  try {
    console.log('測試創建精靈時的外鍵錯誤...');
    
    // 使用有效的使用者 ID（從資料庫中獲取）
    const validUserId = 'cmtq53zln0000q0isdxvz0hc1'; // 這是我們從資料庫中看到的有效使用者 ID
    
    console.log('使用有效使用者 ID:', validUserId);
    
    // 嘗試創建精靈
    const spirit = await spiritService.createSpirit({
      userId: validUserId,
      name: '測試精靈2',
      element: 'FIRE',
      personality: '活潑',
      appearance: '紅色火焰精靈'
    });
    
    console.log('✅ 成功創建精靈:', spirit.name);
    
    // 現在測試一個無效的使用者 ID
    console.log('\n測試無效使用者 ID...');
    try {
      const invalidSpirit = await spiritService.createSpirit({
        userId: 'invalid-user-id-123',
        name: '錯誤測試精靈',
        element: 'WATER',
        personality: '冷靜',
        appearance: '藍色水精靈'
      });
      console.log('❌ 不應該成功創建精靈');
    } catch (error: any) {
      console.log('✅ 如預期般失敗:', error.message);
    }
    
  } catch (error: any) {
    console.error('❌ 測試失敗:', error.message);
    console.error('完整錯誤:', error);
  }
}

testCreateSpiritError();