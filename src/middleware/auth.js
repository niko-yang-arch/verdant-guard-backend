/**
 * 统一认证中间件
 * 
 * 功能说明：
 * - 从请求头中提取 JWT token
 * - 验证 token 的有效性
 * - 将用户 ID 注入到请求对象中，供后续路由处理器使用
 * 
 * 使用场景：
 * - 所有需要用户认证的 API 路由都应该使用此中间件
 * - 在路由的 preHandler 钩子中注册
 */

import { ZodError } from 'zod';

/**
 * 统一认证中间件函数
 * 
 * @param {Object} request - Fastify 请求对象
 * @param {Object} reply - Fastify 响应对象
 * 
 * @description
 * 1. 从请求头 Authorization 字段中提取 Bearer token
 * 2. 使用 Fastify 的 jwtVerify() 方法验证 token
 * 3. 验证通过后，将解码的用户 ID 注入到 request.userId
 * 4. 验证失败则返回 401 未授权错误
 */
export async function authMiddleware(request, reply) {
  try {
    const decoded = await request.jwtVerify();
    request.userId = decoded.userId;
  } catch (err) {
    return reply.fail(401, 'Unauthorized');
  }
}
