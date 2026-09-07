import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUsersAndFix() {
  console.log('=== 檢查使用者並修復登入問題 ===\n');

  try {
    // 1. 檢查資料庫中的使用者
    console.log('1. 檢查資料庫中的使用者:');
    const users = await prisma.user.findMany();
    console.log(`   資料庫使用者數量: ${users.length}`);
    
    if (users.length > 0) {
      console.log('   使用者列表:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Username: ${user.username}`);
      });
    } else {
      console.log('   ⚠️ 資料庫中沒有使用者');
    }
    console.log();

    // 2. 檢查預設帳號是否存在
    console.log('2. 檢查預設帳號:');
    const adminEmail = 'admin@nightasaur.com';
    const demoEmail = 'demo@nightasaur.com';
    
    const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
    const demoUser = await prisma.user.findFirst({ where: { email: demoEmail } });
    
    console.log(`   ${adminEmail}: ${adminUser ? '存在' : '不存在'}`);
    console.log(`   ${demoEmail}: ${demoUser ? '存在' : '不存在'}`);
    console.log();

    // 3. 創建缺失的預設帳號
    console.log('3. 創建缺失的預設帳號:');
    
    if (!adminUser) {
      console.log(`   創建管理員帳號: ${adminEmail}`);
      const adminHash = await bcrypt.hash('admin123!', 12);
      await prisma.user.create({
        data: {
          email: adminEmail,
          username: 'Nightasaur管理員',
          passwordHash: adminHash,
          role: 'ADMIN',
          isActive: true,
          bio: 'Nightasaur 系統管理員'
        }
      });
      console.log('   ✅ 管理員帳號創建成功');
    }
    
    if (!demoUser) {
      console.log(`   創建示範帳號: ${demoEmail}`);
      const demoHash = await bcrypt.hash('demo1234', 12);
      await prisma.user.create({
        data: {
          email: demoEmail,
          username: '精靈訓練家',
          passwordHash: demoHash,
          role: 'USER',
          isActive: true,
          bio: '示範用戶，擁有3隻精靈'
        }
      });
      console.log('   ✅ 示範帳號創建成功');
    }
    
    if (adminUser && demoUser) {
      console.log('   ✅ 所有預設帳號都已存在');
    }
    console.log();

    // 4. 測試密碼驗證
    console.log('4. 測試密碼驗證:');
    
    const testAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });
    if (testAdmin) {
      const adminValid = await bcrypt.compare('admin123!', testAdmin.passwordHash);
      console.log(`   ${adminEmail} 密碼驗證: ${adminValid ? '✅ 正確' : '❌ 錯誤'}`);
    }
    
    const testDemo = await prisma.user.findFirst({ where: { email: demoEmail } });
    if (testDemo) {
      const demoValid = await bcrypt.compare('demo1234', testDemo.passwordHash);
      console.log(`   ${demoEmail} 密碼驗證: ${demoValid ? '✅ 正確' : '❌ 錯誤'}`);
    }
    console.log();

    // 5. 檢查 authService 是否使用資料庫
    console.log('5. 檢查認證服務:');
    console.log('   ⚠️ 當前 authService 使用 tempUsers (臨時存儲)');
    console.log('   ✅ 需要修改為使用 Prisma 資料庫');
    console.log();

    // 6. 解決方案
    console.log('6. 解決方案:');
    console.log('   a) 修改 authService 使用 Prisma 資料庫');
    console.log('   b) 或者直接使用資料庫中的測試帳號');
    console.log('   c) 測試帳號: test@nightasaur.com / testpassword');

  } catch (error: any) {
    console.error('❌ 檢查過程中發生錯誤:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== 檢查完成 ===');
  }
}

checkUsersAndFix();