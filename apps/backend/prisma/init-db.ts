// 資料庫初始化腳本
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('開始初始化資料庫...');

  try {
    // 檢查資料庫連接
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');

    // 建立測試使用者
    const testUser = await prisma.user.upsert({
      where: { email: 'test@nightasaur.com' },
      update: {},
      create: {
        email: 'test@nightasaur.com',
        username: 'testuser',
        passwordHash: '$2a$10$K7VYVq8Q7QNQ8Q7Q8Q7Q8Q', // 測試密碼
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: '測試使用者',
        role: 'PLAYER',
        trainerXp: 0,
        trainerLevel: 1,
        gems: 100,
        coins: 1000,
        isActive: true,
      },
    });
    console.log('✅ 測試使用者建立成功:', testUser.username);

    // 建立語言設定
    const languagePref = await prisma.languagePreference.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        primaryLang: 'zh-TW',
        secondaryLang: 'en',
        displayMode: 'SINGLE',
        fontSize: 16,
        theme: 'LIGHT',
        autoDetect: true,
      },
    });
    console.log('✅ 語言設定建立成功');

    // 建立使用者設定
    const userSettings = await prisma.userSettings.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        musicVolume: 70,
        soundVolume: 80,
        musicEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        vibrationStrength: 50,
      },
    });
    console.log('✅ 使用者設定建立成功');

    // 建立測試精靈
    const testSpirit = await prisma.spirit.create({
      data: {
        userId: testUser.id,
        name: '小火龍',
        element: 'FIRE',
        species: 'Dragon',
        personality: '活潑好動',
        appearance: '紅色的小龍',
        stage: 'EGG',
        level: 1,
        experience: 0,
        stats: '{"attack": 10, "defense": 8, "speed": 12}',
        skills: '["火焰吐息", "爪擊"]',
        customization: '{"color": "red", "size": "small"}',
        backstory: '一隻剛出生的火屬性精靈',
        isActive: true,
      },
    });
    console.log('✅ 測試精靈建立成功:', testSpirit.name);

    // 建立測試物品
    const testItem = await prisma.item.upsert({
      where: { name: '精靈球' },
      update: {},
      create: {
        name: '精靈球',
        description: '用於捕捉精靈的基本道具',
        type: 'CAPTURE',
        rarity: 'COMMON',
        effect: '提高捕捉成功率10%',
        iconUrl: 'https://example.com/pokeball.png',
        price: 100,
        isActive: true,
      },
    });
    console.log('✅ 測試物品建立成功:', testItem.name);

    // 建立使用者物品
    const userItem = await prisma.userItem.upsert({
      where: {
        userId_itemId: {
          userId: testUser.id,
          itemId: testItem.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        itemId: testItem.id,
        quantity: 5,
      },
    });
    console.log('✅ 使用者物品建立成功');

    // 建立測試任務
    const testQuest = await prisma.quest.create({
      data: {
        title: '新手訓練',
        description: '完成第一次精靈訓練',
        type: 'TRAINING',
        difficulty: 'EASY',
        reward: '{"gems": 50, "coins": 200}',
        isActive: true,
      },
    });
    console.log('✅ 測試任務建立成功:', testQuest.title);

    // 建立任務進度
    const questProgress = await prisma.questProgress.create({
      data: {
        userId: testUser.id,
        questId: testQuest.id,
        progress: 0,
        completed: false,
        claimed: false,
      },
    });
    console.log('✅ 任務進度建立成功');

    console.log('\n🎉 資料庫初始化完成！');
    console.log('📊 統計資料:');
    console.log(`   使用者: 1`);
    console.log(`   精靈: 1`);
    console.log(`   物品: 1`);
    console.log(`   任務: 1`);

  } catch (error) {
    console.error('❌ 初始化失敗:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });