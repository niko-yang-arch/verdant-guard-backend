import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plants = await prisma.plant.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
    }
  });

  console.log('🌿 数据库中的植物ID：');
  plants.forEach(plant => {
    console.log(`ID: ${plant.id} (类型: ${typeof plant.id}) - ${plant.name}`);
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
