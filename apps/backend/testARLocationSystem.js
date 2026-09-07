import { arLocationService } from "./src/services/arLocation.js";
import { googleMapsService } from "./src/services/googleMaps.js";

// 測試數據
const TEST_USER_ID = "test-user-ar-001";
const TEST_COORDINATES = {
  taipei101: { latitude: 25.033964, longitude: 121.564468 },
  daanPark: { latitude: 25.029393, longitude: 121.536017 },
  taipeiStation: { latitude: 25.047760, longitude: 121.517049 }
};

async function testARLocationSystem() {
  console.log("🧭 測試 AR 位置系統...\n");
  
  try {
    // 1. 測試更新玩家位置
    console.log("1. 測試更新玩家位置...");
    const locationResult = await arLocationService.updatePlayerLocation(
      TEST_USER_ID,
      TEST_COORDINATES.taipei101.latitude,
      TEST_COORDINATES.taipei101.longitude,
      10, // accuracy
      50, // altitude
      1.5, // speed
      90 // heading
    );
    console.log("位置更新成功:", {
      nearbySpawns: locationResult.nearbySpawns,
      nearbyHotspots: locationResult.nearbyHotspots
    });
    
    // 2. 測試獲取附近生成點
    console.log("\n2. 測試獲取附近生成點...");
    const nearbySpawns = await arLocationService.getNearbySpawns(
      TEST_COORDINATES.taipei101.latitude,
      TEST_COORDINATES.taipei101.longitude,
      500
    );
    console.log(`找到 ${nearbySpawns.length} 個附近生成點`);
    
    // 3. 測試獲取附近熱點
    console.log("\n3. 測試獲取附近熱點...");
    const nearbyHotspots = await arLocationService.getNearbyHotspots(
      TEST_COORDINATES.taipei101.latitude,
      TEST_COORDINATES.taipei101.longitude,
      1000
    );
    console.log(`找到 ${nearbyHotspots.length} 個附近熱點`);
    
    // 4. 測試 Google Maps 整合
    console.log("\n4. 測試 Google Maps 整合...");
    const placesResult = await googleMapsService.findNearbyPlaces(
      TEST_COORDINATES.taipei101.latitude,
      TEST_COORDINATES.taipei101.longitude,
      1000,
      "shopping_mall"
    );
    console.log(`Google Maps 找到 ${placesResult.results.length} 個附近地點`);
    
    // 5. 測試自動探索並創建熱點
    console.log("\n5. 測試自動探索並創建熱點...");
    const explorationResult = await googleMapsService.autoExploreAndCreateHotspots(
      TEST_USER_ID,
      TEST_COORDINATES.taipei101.latitude,
      TEST_COORDINATES.taipei101.longitude,
      2000
    );
    console.log("自動探索結果:", {
      totalPlaces: explorationResult.totalPlaces,
      createdHotspots: explorationResult.createdHotspots
    });
    
    // 6. 測試獲取探索路線
    console.log("\n6. 測試獲取探索路線...");
    const route = await arLocationService.getExplorationRoute(
      TEST_USER_ID,
      TEST_COORDINATES.taipei101.latitude,
      TEST_COORDINATES.taipei101.longitude,
      2000
    );
    console.log("探索路線:", {
      totalHotspots: route.totalHotspots,
      totalDistance: `${Math.round(route.totalDistance)} 米`,
      estimatedTime: `${route.estimatedTime} 分鐘`
    });
    
    // 7. 測試導航路線
    console.log("\n7. 測試導航路線...");
    const navigationRoute = await googleMapsService.getNavigationRoute(
      TEST_COORDINATES.taipei101.latitude,
      TEST_COORDINATES.taipei101.longitude,
      TEST_COORDINATES.daanPark.latitude,
      TEST_COORDINATES.daanPark.longitude,
      "walking"
    );
    console.log("導航路線:", {
      distance: navigationRoute.routes[0].legs[0].distance.text,
      duration: navigationRoute.routes[0].legs[0].duration.text
    });
    
    // 8. 測試生成新的精靈生成
    console.log("\n8. 測試生成新的精靈生成...");
    const newSpawns = await arLocationService.generateNewSpawns();
    console.log(`生成 ${newSpawns.length} 個新的精靈生成點`);
    
    // 9. 測試玩家探索統計
    console.log("\n9. 測試玩家探索統計...");
    const stats = await arLocationService.getPlayerExplorationStats(TEST_USER_ID);
    console.log("玩家探索統計:", {
      totalVisits: stats.totalVisits,
      uniqueLocations: stats.uniqueLocations,
      spiritsFound: stats.spiritsFound
    });
    
    console.log("\n✅ AR 位置系統測試完成！");
    console.log("\n📊 系統功能總結:");
    console.log("  • 位置追蹤：✓");
    console.log("  • 附近生成點偵測：✓");
    console.log("  • Google Maps 整合：✓");
    console.log("  • 自動熱點探索：✓");
    console.log("  • 探索路線規劃：✓");
    console.log("  • 導航功能：✓");
    console.log("  • 精靈生成系統：✓");
    console.log("  • 探索統計：✓");
    
  } catch (error) {
    console.error("❌ 測試失敗:", error);
    process.exit(1);
  }
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  testARLocationSystem()
    .then(() => {
      console.log("\n🎉 所有測試完成！");
      console.log("\n📱 AR 位置系統已準備好使用！");
      console.log("\n📋 API 端點:");
      console.log("  • POST   /api/ar/location        - 更新玩家位置");
      console.log("  • GET    /api/ar/spawns/nearby   - 獲取附近生成點");
      console.log("  • GET    /api/ar/hotspots/nearby - 獲取附近熱點");
      console.log("  • POST   /api/ar/visit           - 造訪地點");
      console.log("  • POST   /api/ar/capture         - AR 捕捉精靈");
      console.log("  • GET    /api/ar/route           - 獲取探索路線");
      console.log("  • GET    /api/ar/stats           - 獲取探索統計");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 測試執行失敗:", error);
      process.exit(1);
    });
}

export { testARLocationSystem };