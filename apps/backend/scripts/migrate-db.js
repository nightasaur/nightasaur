#!/usr/bin/env node
/**
 * Nightasaur 資料庫遷移工具
 * 用於從 SQLite 遷移到 PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Nightasaur 資料庫遷移工具');
  console.log('====================================\n');

  // 檢查環境變數
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ 錯誤：未設定 DATABASE_URL 環境變數');
    console.log('請在 .env 檔案中設定 DATABASE_URL');
    console.log('範例：postgresql://postgres:postgres@localhost:5432/nightasaur');
    process.exit(1);
  }

  console.log(`📊 資料庫連線：${dbUrl}`);
  
  const isPostgres = dbUrl.includes('postgresql://');
  console.log(`📦 資料庫類型：${isPostgres ? 'PostgreSQL' : 'SQLite'}\n`);

  try {
    // 初始化 Prisma 客戶端
    const prisma = new PrismaClient();
    
    // 測試連線
    console.log('🔄 測試資料庫連線...');
    await prisma.$connect();
    console.log('✅ 資料庫連線成功\n');

    // 檢查現有資料表
    console.log('📋 檢查資料庫結構...');
    
    if (isPostgres) {
      // PostgreSQL 特定檢查
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `;
      
      console.log(`📊 現有資料表數量：${tables.length}`);
      
      if (tables.length === 0) {
        console.log('📝 資料庫為空，準備建立新結構...');
        console.log('💡 請執行：npx prisma db push');
      } else {
        console.log('📝 資料庫已有資料，請確認遷移策略');
        console.log('💡 建議步驟：');
        console.log('   1. 備份現有資料');
        console.log('   2. 執行：npx prisma migrate dev --name init');
        console.log('   3. 驗證資料完整性');
      }
    } else {
      // SQLite 特定檢查
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `;
      
      console.log(`📊 現有資料表數量：${tables.length}`);
      
      if (tables.length > 0) {
        console.log('⚠️  SQLite 資料庫有資料，建議先備份再遷移到 PostgreSQL');
        console.log('💡 遷移步驟：');
        console.log('   1. 備份 SQLite 檔案 (dev.db)');
        console.log('   2. 匯出資料為 SQL 或 JSON');
        console.log('   3. 切換到 PostgreSQL 連線');
        console.log('   4. 執行：npx prisma db push');
        console.log('   5. 匯入資料到 PostgreSQL');
      }
    }

    await prisma.$disconnect();
    console.log('\n✅ 遷移檢查完成');
    
  } catch (error) {
    console.error('❌ 遷移過程中發生錯誤：', error.message);
    console.log('\n💡 疑難排解：');
    console.log('   1. 確認 PostgreSQL 服務是否運行');
    console.log('   2. 檢查 DATABASE_URL 格式是否正確');
    console.log('   3. 確認資料庫使用者權限');
    console.log('   4. 嘗試使用：npx prisma db push --force (謹慎使用)');
    process.exit(1);
  }
}

// 執行主程式
main().catch((error) => {
  console.error('❌ 未預期的錯誤：', error);
  process.exit(1);
});