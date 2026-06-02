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

    const tokenData = await wechat.getAccessTokenByCode(code);
    const userInfo = await wechat.getUserInfo(tokenData.access_token, tokenData.openid);

    const { prisma } = fastify;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { unionId: userInfo.unionid },
          { openId: userInfo.openid },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          unionId: userInfo.unionid || null,
          openId: userInfo.openid,
          nickname: userInfo.nickname || null,
          avatar: userInfo.headimgurl || null,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          nickname: userInfo.nickname || user.nickname,
          avatar: userInfo.headimgurl || user.avatar,
        },
      });
    }

    const token = fastify.jwt.sign({ userId: user.id });

    const result = {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        plantCount: user.plants?.length ?? 0,
      },
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
