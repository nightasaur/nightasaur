import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseForeignKeyIssue() {
  console.log('=== 開始診斷外鍵約束問題 ===\n');

  try {
    // 1. 檢查資料庫連接
    await prisma.$connect();
    console.log('✅ 資料庫連接成功\n');

    // 2. 檢查 users 表
    console.log('1. 檢查 users 表:');
    const users = await prisma.user.findMany();
    console.log(`   使用者數量: ${users.length}`);
    
    if (users.length > 0) {
      console.log('   使用者列表:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Username: ${user.username}`);
      });
    } else {
      console.log('   ⚠️ 警告: users 表為空！');
    }
    console.log();

    // 3. 檢查 spirits 表
    console.log('2. 檢查 spirits 表:');
    const spirits = await prisma.spirit.findMany({
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });
    console.log(`   精靈數量: ${spirits.length}`);
    
    if (spirits.length > 0) {
      console.log('   精靈列表:');
      spirits.forEach((spirit, index) => {
        console.log(`   ${index + 1}. ID: ${spirit.id}, Name: ${spirit.name}, User ID: ${spirit.userId}`);
        console.log(`      使用者存在: ${spirit.user ? '是' : '否'}`);
        if (spirit.user) {
          console.log(`      使用者 Email: ${spirit.user.email}`);
        }
      });
    }
    console.log();

    // 4. 檢查資料庫外鍵約束
    console.log('3. 檢查資料庫結構:');
    
    // 嘗試手動檢查外鍵關係
    if (users.length > 0 && spirits.length > 0) {
      const testUserId = users[0].id;
      const testSpiritId = spirits[0].id;
      
      console.log(`   測試使用者 ID: ${testUserId}`);
      console.log(`   測試精靈 ID: ${testSpiritId}`);
      
      // 檢查特定使用者是否存在
      const specificUser = await prisma.user.findUnique({
        where: { id: testUserId }
      });
      console.log(`   測試使用者存在: ${specificUser ? '是' : '否'}`);
      
      // 檢查特定精靈的使用者是否存在
      const spiritUser = await prisma.user.findUnique({
        where: { id: spirits[0].userId }
      });
      console.log(`   精靈 ${spirits[0].name} 的使用者存在: ${spiritUser ? '是' : '否'}`);
    }
    console.log();

    // 5. 測試創建新精靈
    console.log('4. 測試創建新精靈:');
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`   使用測試使用者: ${testUser.username} (ID: ${testUser.id})`);
      
      try {
        const newSpirit = await prisma.spirit.create({
          data: {
            userId: testUser.id,
            name: `診斷測試精靈_${Date.now()}`,
            element: 'FIRE',
            personality: '測試用',
            appearance: '診斷測試精靈',
            stage: 'EGG',
            level: 1,
            experience: 0,
            stats: JSON.stringify({ hp: 50, atk: 10, def: 8, spd: 12 }),
            skills: JSON.stringify(['火焰吐息']),
            customization: JSON.stringify({}),
            isActive: true
          }
        });
        console.log(`   ✅ 成功創建精靈: ${newSpirit.name}`);
        console.log(`      精靈 ID: ${newSpirit.id}`);
      } catch (error: any) {
        console.log(`   ❌ 創建失敗: ${error.message}`);
        console.log(`      錯誤詳情:`, error);
      }
    } else {
      console.log('   ⚠️ 無法測試: 沒有可用的使用者');
    }
    console.log();

    // 6. 檢查 Schema 定義
    console.log('5. 檢查 Prisma Schema 定義:');
    console.log('   - Spirit 模型應有 userId 欄位');
    console.log('   - userId 應有 @relation 到 User 模型');
    console.log('   - 外鍵約束應為 onDelete: Cascade');
    console.log();

    // 7. 檢查資料庫遷移狀態
    console.log('6. 建議的解決步驟:');
    console.log('   1. 檢查前端是否發送正確的 userId');
    console.log('   2. 確認使用者已登入且令牌有效');
    console.log('   3. 運行 npx prisma db push 確保資料庫同步');
    console.log('   4. 檢查是否有任何資料庫約束錯誤');

  } catch (error: any) {
    console.error('❌ 診斷過程中發生錯誤:', error.message);
    console.error('完整錯誤:', error);
  } finally {
    await prisma.$disconnect();
    console.log('=== 診斷完成 ===');
  }
}

diagnoseForeignKeyIssue();