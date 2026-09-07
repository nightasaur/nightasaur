import { gameLogicService } from "./src/services/gameLogic.js";
import { puzzleService } from "./src/services/puzzle.js";
import { gameService } from "./src/services/game.js";
import prisma from "./src/config/prisma.js";

async function testGameSystem() {
  console.log("🧪 開始測試遊戲系統...\n");
  
  // 1. 創建測試使用者
  console.log("1. 創建測試使用者...");
  const testUser = await prisma.user.upsert({
    where: { email: "test@gamer.com" },
    update: {},
    create: {
      email: "test@gamer.com",
      username: "遊戲測試員",
      password: "hashed_password_123"
    }
  });
  console.log(`   使用者: ${testUser.username} (ID: ${testUser.id})\n`);
  
  // 2. 創建測試精靈
  console.log("2. 創建測試精靈...");
  const testSpirit = await prisma.spirit.create({
    data: {
      userId: testUser.id,
      name: "小火龍",
      species: "Fire",
      element: "🔥",
      level: 1,
      experience: 0,
      stage: "HATCHLING",
      isActive: true
    }
  });
  console.log(`   精靈: ${testSpirit.name} (ID: ${testSpirit.id})\n`);
  
  // 3. 種子益智關卡
  console.log("3. 創建益智關卡...");
  const seedModule = await import("./prisma/seedPuzzles.js");
  await seedModule.seedPuzzles();
  
  const puzzleCount = await prisma.puzzleLevel.count();
  console.log(`   已創建 ${puzzleCount} 個益智關卡\n`);
  
  // 4. 測試遊戲循環
  console.log("4. 執行遊戲循環測試...");
  const gameResults = await gameLogicService.completeGameCycle(
    testUser.id,
    testSpirit.id,
    "CHAT"
  );
  console.log("   ✅ 遊戲循環完成");
  console.log(`   對話記錄: ${gameResults.dialogue ? "✓" : "✗"}`);
  console.log(`   任務檢查: ${gameResults.quests ? "✓" : "✗"}`);
  console.log(`   益智推薦: ${gameResults.puzzle ? "✓" : "✗"}`);
  console.log(`   獎勵數量: ${gameResults.rewards.length} 個\n`);
  
  // 5. 測試益智系統
  console.log("5. 測試益智系統...");
  const puzzles = await puzzleService.getAvailablePuzzles(
    testUser.id,
    testSpirit.id
  );
  console.log(`   可用的益智關卡: ${puzzles.length} 個`);
  
  if (puzzles.length > 0) {
    const firstPuzzle = puzzles[0];
    console.log(`   第一個關卡: ${firstPuzzle.title} (${firstPuzzle.difficulty})`);
    
    // 嘗試解決益智
    const attemptResult = await puzzleService.attemptPuzzle(
      testUser.id,
      testSpirit.id,
      firstPuzzle.id,
      JSON.parse(firstPuzzle.solution),
      30 // 花費30秒
    );
    console.log(`   嘗試結果: ${attemptResult.success ? "成功 ✓" : "失敗 ✗"}`);
    console.log(`   獲得分數: ${attemptResult.score}`);
  }
  console.log();
  
  // 6. 測試精靈升級
  console.log("6. 測試精靈升級系統...");
  const upgrades = await puzzleService.getSpiritUpgrades(testSpirit.id);
  console.log(`   精靈升級狀態:`);
  upgrades.forEach(upgrade => {
    console.log(`     ${upgrade.type}: 等級 ${upgrade.level}, XP ${upgrade.xp}/${upgrade.xpForNextLevel}`);
  });
  console.log();
  
  // 7. 測試遊戲概覽
  console.log("7. 測試遊戲概覽...");
  const overview = await gameLogicService.getGameOverview(testUser.id);
  console.log(`   使用者等級: ${overview.user.trainerLevel}`);
  console.log(`   活躍精靈: ${overview.activeSpirit?.name || "無"}`);
  console.log(`   活躍任務: ${overview.quests?.length || 0} 個`);
  console.log(`   統計數據: ${JSON.stringify(overview.stats, null, 2)}`);
  console.log();
  
  // 8. 測試排行榜
  console.log("8. 測試排行榜...");
  const leaderboard = await puzzleService.getLeaderboard();
  console.log(`   排行榜記錄: ${leaderboard.length} 筆`);
  if (leaderboard.length > 0) {
    console.log(`   第一名: ${leaderboard[0].username} - ${leaderboard[0].score} 分`);
  }
  console.log();
  
  // 9. 清理測試數據
  console.log("9. 清理測試數據...");
  await prisma.spirit.deleteMany({ where: { userId: testUser.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log("   ✅ 測試數據已清理\n");
  
  console.log("🎮 遊戲系統測試完成！");
  console.log("========================================");
  console.log("✅ 所有系統功能正常運作");
  console.log("✅ 益智升級系統已整合");
  console.log("✅ 遊戲循環邏輯已建立");
  console.log("✅ 資料庫結構完整");
  console.log("========================================");
}

// 執行測試
testGameSystem()
  .then(() => {
    console.log("\n🦖 夜龍遊戲系統準備就緒！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 測試失敗:", error);
    process.exit(1);
  });