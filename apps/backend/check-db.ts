import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('檢查資料庫狀態...');
    
    // 檢查使用者
    const users = await prisma.user.findMany();
    console.log('使用者數量:', users.length);
    console.log('使用者列表:');
    users.forEach(u => console.log(`  ID: ${u.id}, Email: ${u.email}, Username: ${u.username}`));
    
    // 檢查精靈
    const spirits = await prisma.spirit.findMany({
      include: { user: { select: { id: true, email: true } } }
    });
    console.log('\n精靈數量:', spirits.length);
    console.log('精靈列表:');
    spirits.forEach(s => console.log(`  ID: ${s.id}, Name: ${s.name}, User ID: ${s.userId}, User Email: ${s.user?.email}`));
    
    // 檢查外鍵關係
    console.log('\n檢查外鍵關係...');
    if (spirits.length > 0) {
      const spirit = spirits[0];
      const user = await prisma.user.findUnique({ where: { id: spirit.userId } });
      console.log(`精靈 ${spirit.name} 的使用者存在:`, user ? '是' : '否');
    }
    
  } catch (error) {
    console.error('錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();