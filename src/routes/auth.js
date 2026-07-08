/**
 * 认证相关路由模块
 * 
 * 功能说明：
 * - 处理用户登录（微信小程序登录）
 * - 获取当前登录用户信息
 * 
 * API 端点：
 * - POST /api/auth/wechat/login - 微信登录
 * - GET /api/auth/me - 获取当前用户信息
 */

import { WechatService } from '../services/wechat.js';
import { authMiddleware } from '../middleware/auth.js';

/**
 * 认证路由插件
 * 
 * @param {FastifyInstance} fastify - Fastify 实例
 * @param {Object} options - 插件选项
 * 
 * @description
 * 注册认证相关的路由处理器，包括：
 * 1. 微信小程序登录流程
 * 2. 获取当前用户信息
 */
export default async function authRoutes(fastify, options) {
  
  // ========================================
  // 微信小程序登录
  // 端点：POST /api/auth/wechat/login
  // ========================================
  fastify.post('/wechat/login', async (request, reply) => {
    const { code } = request.body;

    if (!code) {
      return reply.fail(400, 'code is required');
    }

    const wechat = new WechatService(
      process.env.WECHAT_APPID,
      process.env.WECHAT_SECRET
    );

    const { prisma } = fastify;
    const sessionData = await wechat.getMiniProgramSessionByCode(code);

    if (!sessionData.openid) {
      if (process.env.NODE_ENV === 'production') {
        return reply.fail(400, 'Invalid WeChat login response');
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          plants: {
            some: {},
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (existingUser) {
        const token = fastify.jwt.sign({ userId: existingUser.id });
        return reply.success({
          token,
          user: await buildUserPayload(prisma, existingUser),
        });
      }

      return reply.fail(400, 'Invalid WeChat login response');
    }

    const userMatcher = sessionData.unionid
      ? [{ unionId: sessionData.unionid }, { openId: sessionData.openid }]
      : [{ openId: sessionData.openid }];

    let user = await prisma.user.findFirst({
      where: {
        OR: userMatcher,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          unionId: sessionData.unionid || null,
          openId: sessionData.openid,
          nickname: '植物爱好者',
          avatar: null,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          unionId: sessionData.unionid || user.unionId,
          openId: sessionData.openid,
        },
      });
    }

    const token = fastify.jwt.sign({ userId: user.id });

    const result = {
      token,
      user: await buildUserPayload(prisma, user),
    };

    return reply.success(result);
  });

  // ========================================
  // 获取当前登录用户信息
  // 端点：GET /api/auth/me
  // ========================================
  fastify.get('/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = request;

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        _count: { 
          select: { plants: true }
        } 
      },
    });

    if (!user) {
      return reply.fail(404, 'User not found');
    }

    const result = {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      plantCount: user._count.plants,
      createdAt: user.createdAt,
    };

    return reply.success(result);
  });
}

async function buildUserPayload(prisma, user) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    plantCount: await prisma.plant.count({ where: { userId: user.id } }),
    createdAt: user.createdAt,
  };
}
