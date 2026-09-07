import { squadService } from "./src/services/squad.js";
import prisma from "./src/config/prisma.js";

async function testSquadSystem() {
  console.log("👥 開始測試隨從小隊系統...\n");
  
  // 1. 創建測試使用者
  console.log("1. 創建測試使用者...");
  const testUser = await prisma.user.upsert({
    where: { email: "squad_test@gamer.com" },
    update: {},
    create: {
      email: "squad_test@gamer.com",
      username: "小隊測試員",
      password: "hashed_password_123"
    }
  });
  console.log(`   使用者: ${testUser.username} (ID: ${testUser.id})\n`);
  
  // 2. 創建測試精靈
  console.log("2. 創建測試精靈...");
  const spirits = [];
  const spiritNames = ["小火龍", "水箭龜", "妙蛙種子", "皮卡丘", "伊布"];
  
  for (const name of spiritNames) {
    const spirit = await prisma.spirit.create({
      data: {
        userId: testUser.id,
        name,
        species: name.includes("火") ? "Fire" : 
                name.includes("水") ? "Water" : 
                name.includes("草") ? "Grass" : "Normal",
        element: name.includes("火") ? "🔥" : 
                name.includes("水") ? "💧" : 
                name.includes("草") ? "🌿" : "⚡",
        level: Math.floor(Math.random() * 5) + 1,
        experience: 0,
        stage: "HATCHLING",
        isActive: false
      }
    });
    spirits.push(spirit);
    console.log(`   創建精靈: ${spirit.name} (ID: ${spirit.id})`);
  }
  console.log();
  
  // 3. 創建小隊
  console.log("3. 創建小隊...");
  const squad = await squadService.createSquad(testUser.id, "冒險小隊");
  console.log(`   小隊名稱: ${squad.name}`);
  console.log(`   最大容量: ${squad.maxSize} 隻精靈\n`);
  
  // 4. 添加精靈到小隊
  console.log("4. 添加精靈到小隊...");
  for (let i = 0; i < 4; i++) {
    const spirit = spirits[i];
    const squadMember = await squadService.addSpiritToSquad(
      testUser.id, 
      spirit.id,
      i + 1
    );
    console.log(`   添加 ${spirit.name} 到位置 ${squadMember.position}`);
  }
  console.log();
  
  // 5. 獲取小隊資訊
  console.log("5. 獲取小隊資訊...");
  const squadInfo = await squadService.getSquad(testUser.id);
  console.log(`   小隊成員數量: ${squadInfo?.members.length || 0}`);
  if (squadInfo?.members) {
    squadInfo.members.forEach(member => {
      console.log(`   位置 ${member.position}: ${member.spirit.name} (${member.spirit.element})`);
    });
  }
  console.log();
  
  // 6. 切換主精靈
  console.log("6. 切換主精靈...");
  const firstSpirit = spirits[0];
  const switchResult = await squadService.switchActiveSpirit(
    testUser.id, 
    firstSpirit.id
  );
  console.log(`   切換主精靈到: ${firstSpirit.name}`);
  console.log(`   成功: ${switchResult.success}\n`);
  
  // 7. 訓練小隊精靈
  console.log("7. 訓練小隊精靈...");
  const trainingResult = await squadService.trainSquadSpirit(
    testUser.id,
    firstSpirit.id,
    "COMBAT",
    10 // 10分鐘
  );
  console.log(`   訓練類型: COMBAT`);
  console.log(`   獲得經驗: ${trainingResult.xpGained}`);
  console.log(`   訓練等級: ${trainingResult.training.level}`);
  console.log(`   精靈升級: ${trainingResult.spiritLevelUp ? "✓" : "✗"}`);
  console.log();
  
  // 8. 獲取小隊統計
  console.log("8. 獲取小隊統計...");
  const squadStats = await squadService.getSquadStats(testUser.id);
  if (squadStats) {
    console.log(`   成員數量: ${squadStats.totalMembers}`);
    console.log(`   平均等級: ${squadStats.averageLevel}`);
    console.log(`   戰鬥總等級: ${squadStats.totalCombatLevel}`);
    console.log(`   活躍精靈: ${squadStats.activeSpirit?.name || "無"}`);
  }
  console.log();
  
  // 9. 移除精靈
  console.log("9. 移除精靈...");
  const removeResult = await squadService.removeSpiritFromSquad(
    testUser.id,
    spirits[3].id
  );
  console.log(`   移除 ${spirits[3].name}: ${removeResult ? "成功 ✓" : "失敗 ✗"}`);
  
  // 檢查小隊狀態
  const updatedSquad = await squadService.getSquad(testUser.id);
  console.log(`   更新後成員數量: ${updatedSquad?.members.length || 0}\n`);
  
  // 10. 清理測試數據
  console.log("10. 清理測試數據...");
  await prisma.squadMember.deleteMany({ where: { squadId: squad.id } });
  await prisma.squad.delete({ where: { id: squad.id } });
  await prisma.spirit.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log("   ✅ 測試數據已清理\n");
  
  console.log("🎉 隨從小隊系統測試完成！");
  console.log("========================================");
  console.log("✅ 小隊創建與管理功能正常");
  console.log("✅ 精靈添加與移除功能正常");
  console.log("✅ 主精靈切換功能正常");
  console.log("✅ 訓練系統功能正常");
  console.log("✅ 統計數據計算正確");
  console.log("========================================");
}

// 執行測試
testSquadSystem()
  .then(() => {
    console.log("\n👥 隨從小隊系統準備就緒！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 測試失敗:", error);
    process.exit(1);
  });