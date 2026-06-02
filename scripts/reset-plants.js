import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let testUser = await prisma.user.findFirst({
    where: { unionId: 'test-union-id' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        unionId: 'test-union-id',
        openId: 'test-open-id',
        nickname: '测试用户',
      },
    });
    console.log('✅ 创建测试用户成功！');
  } else {
    console.log('✅ 找到测试用户！');
  }

  await prisma.plant.deleteMany({
    where: { userId: testUser.id }
  });
  console.log('🗑️ 已清空旧植物数据');

  const plants = [
    {
      name: '绿萝',
      species: '绿萝',
      frequency: 7,
      frequencyType: 'DAYS',
      image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=pothos%20plant%20in%20white%20pot%20indoor&image_size=square',
      userId: testUser.id,
    },
    {
      name: '发财树',
      species: '马拉巴栗',
      frequency: 10,
      frequencyType: 'DAYS',
      image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=money%20tree%20plant%20in%20ceramic%20pot&image_size=square',
      userId: testUser.id,
    },
    {
      name: '多肉',
      species: '多肉植物',
      frequency: 14,
      frequencyType: 'DAYS',
      image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20succulent%20plants%20in%20small%20pots&image_size=square',
      userId: testUser.id,
    },
  ];

  const createdPlants = await prisma.plant.createMany({
    data: plants,
  });

  console.log(`✅ 成功添加 ${createdPlants.count} 条植物数据！`);

  const allPlants = await prisma.plant.findMany({
    where: { userId: testUser.id },
    orderBy: { id: 'asc' },
  });

  console.log('\n🌿 当前植物列表（按ID排序）：');
  allPlants.forEach((plant) => {
    console.log(`${plant.id}. ${plant.name} (${plant.species}) - 浇水频率: 每 ${plant.frequency} ${plant.frequencyType === 'DAYS' ? '天' : '次/天'}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ 操作失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
