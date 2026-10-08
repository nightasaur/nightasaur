import { PrismaClient } from "@prisma/client";
import { NPCS } from "../src/data/npcs.js";

const prisma = new PrismaClient();

async function main() {
  const email = "npc@nightasaur.local";
  const system = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      username: "Nightasaur NPCs",
      passwordHash: "!", // 不給登入
      role: "SYSTEM",
    },
  });

  for (const meta of NPCS) {
    const existing = await prisma.spirit.findFirst({
      where: { userId: system.id, name: meta.name },
    });
    const data = {
      userId: system.id,
      name: meta.name,
      element: meta.element,
      species: "NPC",
      personality: meta.personality,
      backstory: meta.backstory,
      imageUrl: meta.image,
      stage: "LEGENDARY",
      level: 99,
      experience: 0,
      stats: "{}",
      skills: "[]",
      customization: "{}",
      isActive: true,
    };
    if (existing) {
      await prisma.spirit.update({ where: { id: existing.id }, data });
    } else {
      await prisma.spirit.create({ data });
    }
    console.log(`✅ ${meta.name} (${meta.element})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
