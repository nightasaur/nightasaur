import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Nightasaur database...");

  // 建立管理員帳號
  const adminHash = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@nightasaur.com" },
    update: {},
    create: {
      email: "admin@nightasaur.com",
      username: "Nightasaur管理員",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // 建立示範精靈
  const demoHash = await bcrypt.hash("demo1234", 12);
  const demo = await prisma.user.upsert({
    where: { email: "demo@nightasaur.com" },
    update: {},
    create: {
      email: "demo@nightasaur.com",
      username: "精靈訓練家",
      passwordHash: demoHash,
    },
  });

  const demoSpirits = [
    { name: "小烈焰", element: "FIRE", personality: "勇猛熱情", skills: ["火焰爪", "爆裂火花"] },
    { name: "潮汐兒", element: "WATER", personality: "溫柔善良", skills: ["水槍", "潮汐護盾"] },
    { name: "暗影丸", element: "SHADOW", personality: "神秘冷靜", skills: ["暗影爪", "潛行"] },
  ];

  for (const s of demoSpirits) {
    await prisma.spirit.create({
      data: {
        name: s.name,
        userId: demo.id,
        element: s.element,
        personality: s.personality,
        stage: "JUVENILE",
        level: 5 + Math.floor(Math.random() * 10),
        experience: Math.floor(Math.random() * 200),
        stats: JSON.stringify({ hp: 80, atk: 60, def: 50, spd: 55, maxHp: 80 }),
        skills: JSON.stringify(s.skills),
        backstory: `這是一隻${s.personality}的${s.element}屬性精靈，在 Nightasaur 的奇幻世界中被發現。`,
      },
    });
  }

  console.log(`✅ Demo user: ${demo.email} with 3 spirits`);
  console.log("\n🎉 Seed complete!");
  console.log("   Admin login: admin@nightasaur.com / admin123!");
  console.log("   Demo login:  demo@nightasaur.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });