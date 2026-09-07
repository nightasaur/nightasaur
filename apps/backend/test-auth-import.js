// 測試 auth.ts 中的導入
import prisma from "./src/config/prisma.js";
import bcrypt from "bcryptjs";

async function testAuthImport() {
  try {
    console.log("Testing auth.ts imports...");
    
    // 測試 prisma
    console.log("Prisma object:", typeof prisma);
    console.log("Prisma.user:", typeof prisma.user);
    
    // 測試 bcrypt
    const hash = await bcrypt.hash("test123", 12);
    console.log("Bcrypt hash created:", hash.substring(0, 20) + "...");
    
    console.log("✅ All imports working correctly");
  } catch (error) {
    console.error("❌ Import error:", error.message);
    console.error("Stack:", error.stack);
  }
}

testAuthImport();