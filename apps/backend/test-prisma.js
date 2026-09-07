import prisma from "./src/config/prisma.js";

async function testPrisma() {
  try {
    console.log("Testing Prisma connection...");
    
    // 測試連接
    await prisma.$connect();
    console.log("✅ Prisma connected successfully");
    
    // 測試查詢
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} users`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ Prisma error:", error.message);
  }
}

testPrisma();