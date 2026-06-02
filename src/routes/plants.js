/**
 * 植物管理路由模块
 * 
 * 功能说明：
 * - 植物的增删改查（CRUD）操作
 * - 所有操作需要用户登录认证
 * 
 * API 端点：
 * - GET /api/plants/list - 获取当前用户的所有植物列表
 * - GET /api/plants/info/:id - 获取单个植物详情（包含浇水历史）
 * - POST /api/plants/add - 添加新植物
 * - POST /api/plants/update/:id - 更新植物信息
 * - POST /api/plants/delete/:id - 删除植物
 */

import { plantSchema, updatePlantSchema } from '../schemas/validation.js';
import { authMiddleware } from '../middleware/auth.js';

/**
 * 植物管理路由插件
 * 
 * @param {FastifyInstance} fastify - Fastify 实例
 * @param {Object} options - 插件选项
 * 
 * @description
 * 所有路由都需要用户认证（通过 authMiddleware 中间件）
 * 用户只能操作自己的植物数据
 */
export default async function plantRoutes(fastify, options) {
  
  // 所有植物相关路由都需要认证
  fastify.addHook('preHandler', authMiddleware);

  // ========================================
  // 获取当前用户的所有植物列表
  // 端点：GET /api/plants/list
  // ========================================
  fastify.get('/list', async (request, reply) => {
    const { userId } = request;

    const plants = await fastify.prisma.plant.findMany({
      where: { userId },
      include: {
        _count: { select: { waterLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = plants.map(p => ({
      id: p.id,
      name: p.name,
      species: p.species,
      frequency: Number(p.frequency),
      frequencyType: p.frequencyType,
      image: p.image,
      lastWatered: p.lastWatered,
      createdAt: p.createdAt,
      historyCount: p._count.waterLogs,
    }));

    return reply.success(result);
  });

  // ========================================
  // 获取单个植物详情
  // 端点：GET /api/plants/info/:id
  // ========================================
  fastify.get('/info/:id', async (request, reply) => {
    const { userId } = request;
    const { id } = request.params;
    const plantId = parseInt(id, 10);

    const plant = await fastify.prisma.plant.findFirst({
      where: { id: plantId, userId },
      include: {
        waterLogs: {
          orderBy: { wateredAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!plant) {
      return reply.fail(404, 'Plant not found');
    }

    const result = {
      ...plant,
      frequency: Number(plant.frequency),
      history: plant.waterLogs.map(w => ({
        id: w.id,
        date: w.wateredAt,
      })),
    };

    return reply.success(result);
  });

  // ========================================
  // 添加新植物
  // 端点：POST /api/plants/add
  // ========================================
  fastify.post('/add', async (request, reply) => {
    const { userId } = request;
    
    const validated = plantSchema.parse(request.body);

    const plant = await fastify.prisma.plant.create({
      data: {
        ...validated,
        frequency: validated.frequency,
        userId,
      },
    });

    const result = {
      ...plant,
      frequency: Number(plant.frequency),
    };

    return reply.success(result);
  });

  // ========================================
  // 更新植物信息
  // 端点：POST /api/plants/update/:id
  // ========================================
  fastify.post('/update/:id', async (request, reply) => {
    const { userId } = request;
    const { id } = request.params;
    const plantId = parseInt(id, 10);
    
    const validated = updatePlantSchema.parse(request.body);

    const existing = await fastify.prisma.plant.findFirst({
      where: { id: plantId, userId },
    });

    if (!existing) {
      return reply.fail(404, 'Plant not found');
    }

    const plant = await fastify.prisma.plant.update({
      where: { id: plantId },
      data: validated,
    });

    const result = {
      ...plant,
      frequency: Number(plant.frequency),
    };

    return reply.success(result);
  });

  // ========================================
  // 删除植物
  // 端点：POST /api/plants/delete/:id
  // ========================================
  fastify.post('/delete/:id', async (request, reply) => {
    const { userId } = request;
    const { id } = request.params;
    const plantId = parseInt(id, 10);

    const existing = await fastify.prisma.plant.findFirst({
      where: { id: plantId, userId },
    });

    if (!existing) {
      return reply.fail(404, 'Plant not found');
    }

    await fastify.prisma.plant.delete({ where: { id: plantId } });

    return reply.success({ success: true });
  });
}
