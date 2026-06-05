/**
 * 浇水记录路由模块
 * 
 * 功能说明：
 * - 记录植物浇水操作
 * - 查询浇水历史和日历视图
 * - 所有操作需要用户登录认证
 * 
 * API 端点：
 * - POST /api/water-logs/add - 记录浇水
 * - GET /api/water-logs/calendar - 获取日历视图数据
 * - GET /api/water-logs/plant/:plantId - 获取特定植物的浇水历史
 */

import { waterLogSchema } from '../schemas/validation.js';
import { authMiddleware } from '../middleware/auth.js';

/**
 * 浇水记录路由插件
 * 
 * @param {FastifyInstance} fastify - Fastify 实例
 * @param {Object} options - 插件选项
 * 
 * @description
 * 所有路由都需要用户认证（通过 authMiddleware 中间件）
 */
export default async function waterLogRoutes(fastify, options) {
  
  // 所有浇水记录相关路由都需要认证
  fastify.addHook('preHandler', authMiddleware);

  // ========================================
  // 记录浇水操作
  // 端点：POST /api/water-logs/add
  // ========================================
  fastify.post('/add', async (request, reply) => {
    const { userId } = request;
    
    const { plantId } = waterLogSchema.parse(request.body);

    const plant = await fastify.prisma.plant.findFirst({
      where: { id: plantId, userId },
    });

    if (!plant) {
      return reply.fail(404, 'Plant not found');
    }

    // 获取今天的开始和结束时间（本地时区）
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 获取今天该植物的所有浇水记录
    const todayLogs = await fastify.prisma.waterLog.findMany({
      where: {
        plantId,
        userId,
        wateredAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 根据 frequencyType 判断浇水频率限制
    if (plant.frequencyType === 'TIMES_PER_DAY') {
      // 每天浇水N次：检查今天浇水次数是否已达到上限
      if (todayLogs.length >= plant.frequency) {
        return reply.fail(400, `每天最多只能浇水 ${plant.frequency} 次，今天的浇水次数已用完~`);
      }
    } else {
      // 每N天浇水一次：同一天只能浇一次
      if (todayLogs.length > 0) {
        return reply.fail(400, '今天已经浇过水了，请明天再来吧~');
      }
    }

    const [waterLog] = await fastify.prisma.$transaction([
      fastify.prisma.waterLog.create({
        data: { plantId, userId },
      }),
      fastify.prisma.plant.update({
        where: { id: plantId },
        data: { lastWatered: new Date() },
      }),
    ]);

    const result = {
      id: waterLog.id,
      date: waterLog.wateredAt,
    };

    return reply.success(result);
  });

  // ========================================
  // 获取日历视图数据
  // 端点：GET /api/water-logs/calendar
  // ========================================
  fastify.get('/calendar', async (request, reply) => {
    const { userId } = request;
    
    const { year, month } = request.query;

    if (!year || !month) {
      return reply.fail(400, 'year and month are required');
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const logs = await fastify.prisma.waterLog.findMany({
      where: {
        userId,
        wateredAt: { 
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        plant: { 
          select: { 
            id: true,
            name: true,
            image: true,
          } 
        },
      },
      orderBy: { wateredAt: 'asc' },
    });

    const byDay = {};
    for (const log of logs) {
      const day = log.wateredAt.getDate();
      
      if (!byDay[day]) {
        byDay[day] = [];
      }
      
      const existing = byDay[day].find(p => p.id === log.plant.id);
      
      if (existing) {
        existing.count += 1;
      } else {
        byDay[day].push({
          id: log.plant.id,
          name: log.plant.name,
          image: log.plant.image,
          count: 1,
        });
      }
    }

    const result = {
      year,
      month,
      data: byDay,
    };

    return reply.success(result);
  });

  // ========================================
  // 获取特定植物的浇水历史
  // 端点：GET /api/water-logs/plant/:plantId
  // ========================================
  fastify.get('/plant/:plantId', async (request, reply) => {
    const { userId } = request;
    
    const { plantId } = request.params;
    const id = parseInt(plantId, 10);

    const plant = await fastify.prisma.plant.findFirst({
      where: { id, userId },
    });

    if (!plant) {
      return reply.fail(404, 'Plant not found');
    }

    const logs = await fastify.prisma.waterLog.findMany({
      where: { plantId: id },
      orderBy: { wateredAt: 'desc' },
      take: 50,
    });

    const result = logs.map(w => ({
      id: w.id,
      date: w.wateredAt,
    }));

    return reply.success(result);
  });
}
