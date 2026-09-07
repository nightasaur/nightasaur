// 數據庫遷移腳本
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 開始數據庫遷移...");
  
  try {
    // 測試連接
    await prisma.$connect();
    console.log("✅ 數據庫連接成功");
    
    // 檢查現有表結構
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;
    
    console.log("📊 現有數據表:");
    console.log(tables);
    
    // 創建默認管理員帳號
    console.log("👤 檢查管理員帳號...");
    const adminExists = await prisma.user.findUnique({
      where: { email: "admin@nightasaur.com" }
    });
    
    if (!adminExists) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          email: "admin@nightasaur.com",
          username: "admin",
          passwordHash,
          avatarUrl: "https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff",
          bio: "系統管理員",
          role: "ADMIN",
          trainerLevel: 100,
          gems: 9999,
          coins: 9999
        }
      });
      console.log("✅ 創建默認管理員帳號: admin@nightasaur.com / admin123");
    } else {
      console.log("✅ 管理員帳號已存在");
    }
    
    // 創建測試用戶
    console.log("👤 檢查測試用戶...");
    const testUserExists = await prisma.user.findUnique({
      where: { email: "test@nightasaur.com" }
    });
    
    if (!testUserExists) {
      const passwordHash = await bcrypt.hash("test123", 10);
      const testUser = await prisma.user.create({
        data: {
          email: "test@nightasaur.com",
          username: "tester",
          passwordHash,
          avatarUrl: "https://ui-avatars.com/api/?name=Tester&background=667eea&color=fff",
          bio: "測試玩家"
        }
      });
      
      // 為測試用戶創建設定
      await prisma.languagePreference.create({
        data: {
          userId: testUser.id,
          primaryLang: "zh-TW",
          displayMode: "SINGLE",
          fontSize: 16,
          theme: "LIGHT",
          autoDetect: true,
          showEnglishHint: true
        }
      });
      
      await prisma.userSettings.create({
        data: {
          userId: testUser.id,
          musicVolume: 70,
          soundVolume: 80,
          musicEnabled: true,
          soundEnabled: true,
          vibrationEnabled: true,
          vibrationStrength: 50,
          notificationsEnabled: true,
          pushNotifications: true,
          autoSaveEnabled: true,
          showTutorials: true,
          graphicsQuality: "MEDIUM",
          shadowsEnabled: true,
          touchSensitivity: 50,
          autoAimEnabled: true
        }
      });
      
      console.log("✅ 創建測試用戶: test@nightasaur.com / test123");
    } else {
      console.log("✅ 測試用戶已存在");
    }
    
    console.log("🎉 數據庫遷移完成！");
    
  } catch (error) {
    console.error("❌ 遷移錯誤:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();