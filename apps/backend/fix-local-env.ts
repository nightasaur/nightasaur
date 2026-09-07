import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function fixLocalEnvironment() {
  console.log('=== 修復本地環境問題 ===\n');

  try {
    // 1. 檢查資料庫檔案
    console.log('1. 檢查資料庫檔案:');
    const dbPath = path.join(process.cwd(), 'dev.db');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`   ✅ dev.db 存在 (大小: ${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`   ❌ dev.db 不存在`);
      console.log(`   💡 將執行資料庫遷移創建資料庫`);
    }
    console.log();

    // 2. 檢查資料庫連接
    console.log('2. 檢查資料庫連接:');
    try {
      await prisma.$connect();
      console.log('   ✅ 資料庫連接成功');
      
      // 檢查 users 表
      const users = await prisma.user.findMany();
      console.log(`   使用者數量: ${users.length}`);
      
      if (users.length > 0) {
        console.log('   使用者列表:');
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.username} (${user.email})`);
        });
      }
    } catch (dbError: any) {
      console.log(`   ❌ 資料庫連接失敗: ${dbError.message}`);
      console.log(`   💡 需要運行資料庫遷移`);
    }
    console.log();

    // 3. 檢查環境變數
    console.log('3. 檢查環境變數:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL || '未設置'}`);
    console.log(`   PORT: ${process.env.PORT || '使用默認值 3002'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '已設置' : '未設置（使用默認值）'}`);
    console.log();

    // 4. 確保預設帳號存在
    console.log('4. 確保預設帳號存在:');
    
    const defaultAccounts = [
      { email: 'admin@nightasaur.com', password: 'admin123!', username: 'Nightasaur管理員', role: 'ADMIN' },
      { email: 'demo@nightasaur.com', password: 'demo1234', username: '精靈訓練家', role: 'USER' },
      { email: 'test@nightasaur.com', password: 'testpassword', username: 'testuser', role: 'USER' }
    ];

    for (const account of defaultAccounts) {
      let user = await prisma.user.findFirst({ where: { email: account.email } });
      
      if (!user) {
        console.log(`   🔧 創建帳號: ${account.email}`);
        const passwordHash = await bcrypt.hash(account.password, 12);
        user = await prisma.user.create({
          data: {
            email: account.email,
            username: account.username,
            passwordHash,
            role: account.role,
            isActive: true,
            bio: account.role === 'ADMIN' ? 'Nightasaur 系統管理員' : '測試用戶'
          }
        });
        console.log(`      ✅ 創建成功 (ID: ${user.id})`);
      } else {
        console.log(`   ✅ ${account.email} 已存在`);
      }
    }
    console.log();

    // 5. 測試密碼驗證
    console.log('5. 測試密碼驗證:');
    for (const account of defaultAccounts) {
      const user = await prisma.user.findFirst({ where: { email: account.email } });
      if (user) {
        const valid = await bcrypt.compare(account.password, user.passwordHash);
        console.log(`   ${account.email}: ${valid ? '✅ 密碼正確' : '❌ 密碼不匹配'}`);
        
        if (!valid) {
          console.log(`      💡 更新密碼...`);
          const newHash = await bcrypt.hash(account.password, 12);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash }
          });
          console.log(`      ✅ 密碼已更新`);
        }
      }
    }
    console.log();

    // 6. 檢查前端配置
    console.log('6. 檢查前端配置:');
    const frontendPath = path.join(process.cwd(), '..', 'frontend');
    if (fs.existsSync(frontendPath)) {
      console.log(`   ✅ 前端目錄存在: ${frontendPath}`);
      
      // 檢查前端 API 配置
      const envExamplePath = path.join(frontendPath, '.env.example');
      const envPath = path.join(frontendPath, '.env');
      
      if (fs.existsSync(envExamplePath)) {
        console.log(`   ✅ 前端 .env.example 存在`);
      }
      
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const hasApiUrl = envContent.includes('VITE_API_URL');
        console.log(`   ✅ 前端 .env 存在`);
        console.log(`      包含 API URL: ${hasApiUrl ? '是' : '否'}`);
      } else {
        console.log(`   ⚠️ 前端 .env 不存在`);
        console.log(`      💡 建議創建 .env 檔案`);
      }
    } else {
      console.log(`   ⚠️ 前端目錄不存在: ${frontendPath}`);
    }
    console.log();

    // 7. 總結與建議
    console.log('7. 總結與建議:');
    console.log(`   ✅ 資料庫: ${fs.existsSync(dbPath) ? '正常' : '需要遷移'}`);
    console.log(`   ✅ 預設帳號: 已確保存在`);
    console.log(`   ✅ 密碼驗證: 已測試`);
    console.log();
    console.log('   建議執行以下命令:');
    console.log('   1. 資料庫遷移: npx prisma db push');
    console.log('   2. 啟動後端: npm run dev');
    console.log('   3. 啟動前端: cd ../frontend && npm run dev');
    console.log();
    console.log('   測試登入:');
    console.log('   - 管理員: admin@nightasaur.com / admin123!');
    console.log('   - 示範: demo@nightasaur.com / demo1234');
    console.log('   - 測試: test@nightasaur.com / testpassword');

  } catch (error: any) {
    console.error('❌ 修復過程中發生錯誤:', error.message);
    console.error('完整錯誤:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== 修復完成 ===');
  }
}

fixLocalEnvironment();