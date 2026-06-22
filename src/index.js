// 导入 Fastify 框架及相关插件
import Fastify from 'fastify';
import cors from '@fastify/cors';          // 跨域资源共享（CORS）支持
import helmet from '@fastify/helmet';       // HTTP 安全头部保护
import jwt from '@fastify/jwt';             // JSON Web Token 认证
import multipart from '@fastify/multipart';  // 文件上传支持
import { PrismaClient } from '@prisma/client'; // ORM 数据库客户端
import Redis from 'ioredis';                 // Redis 缓存客户端

// 导入各个路由模块
import authRoutes from './routes/auth.js';       // 认证路由
import plantRoutes from './routes/plants.js';    // 植物管理路由
import waterLogRoutes from './routes/waterLogs.js'; // 浇水记录路由
import uploadRoutes from './routes/upload.js';   // 文件上传路由
import helpFeedbackRoutes from './routes/helpFeedback.js'; // 帮助与反馈路由
import { authMiddleware } from './middleware/auth.js'; // 认证中间件
import { ZodError } from 'zod'; // 数据验证错误类型

// ========================================
// 环境变量校验
// 确保必需的环境变量都已配置，避免运行时错误
// ========================================
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

// ========================================
// 数据库和缓存初始化
// ========================================

// 初始化 Prisma ORM 客户端，连接 PostgreSQL 数据库
const prisma = new PrismaClient();

// 初始化 Redis 客户端，用于缓存和会话管理
// 配置重试策略：最多重试 3 次，延迟从 100ms 递增到 3000ms
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // 超过 3 次重试后停止
    return Math.min(times * 100, 3000);
  }
});

// ========================================
// Fastify 应用实例创建
// ========================================
const fastify = Fastify({
  logger: {
    // 生产环境只记录警告和错误，开发环境记录所有信息
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
  }
});

// ========================================
// 全局插件注册
// ========================================

// CORS 插件：允许前端跨域访问 API
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true, // 允许的源（前端地址）
  credentials: true // 允许携带认证信息（cookies、Authorization 头等）
});

// Helmet 插件：添加安全相关的 HTTP 头部
// 防止 XSS、点击劫持等常见 Web 攻击
await fastify.register(helmet, {
  contentSecurityPolicy: false // 禁用内容安全策略，避免与前端 CSP 冲突
});

// JWT 插件：配置 JSON Web Token 认证
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET // 用于签名和验证 token 的密钥
});

// Multipart 插件：处理文件上传（multipart/form-data）
await fastify.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 } // 限制文件大小为 5MB
});

// ========================================
// 依赖注入
// 将 prisma 和 redis 实例注入到 Fastify 实例中
// 可以在路由处理器中通过 fastify.prisma 和 fastify.redis 访问
// ========================================
fastify.decorate('prisma', prisma);
fastify.decorate('redis', redis);

// ========================================
// 统一响应格式装饰器
// 为 reply 对象添加统一的响应方法
// ========================================
fastify.decorateReply('success', function(data) {
  this.status(200).send({
    code: 200,
    status: 'normal',
    data: data || null
  });
});

fastify.decorateReply('fail', function(code, message) {
  const statusMap = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error'
  };
  const statusCode = code || 500;
  this.status(statusCode).send({
    code: statusCode,
    status: 'error',
    data: {
      message: message || statusMap[statusCode] || 'Unknown error'
    }
  });
});

// ========================================
// 健康检查端点
// 用于负载均衡器和监控系统检查服务状态
// ========================================
fastify.get('/health', async (request, reply) => {
  return reply.success({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// 全局错误处理
// 统一处理所有未捕获的错误，返回格式化的错误响应
// ========================================
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  const statusCode = error.statusCode || 500;

  if (error instanceof ZodError) {
    return reply.status(400).send({
      code: 400,
      status: 'error',
      data: {
        message: 'Validation Error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }
    });
  }

  if (error.validation) {
    return reply.status(400).send({
      code: 400,
      status: 'error',
      data: {
        message: 'Validation Error',
        details: error.validation
      }
    });
  }

  const message = statusCode >= 500 ? 'Internal Server Error' : error.message;
  return reply.status(statusCode).send({
    code: statusCode,
    status: 'error',
    data: { message }
  });
});

// ========================================
// 路由模块注册
// 为每个路由模块设置 API 前缀
// ========================================
await fastify.register(authRoutes, { prefix: '/api/auth' });         // 认证相关：登录、获取用户信息
await fastify.register(plantRoutes, { prefix: '/api/plants' });     // 植物管理：CRUD 操作
await fastify.register(waterLogRoutes, { prefix: '/api/water-logs' }); // 浇水记录：记录和查询浇水历史
await fastify.register(uploadRoutes, { prefix: '/api/upload' });     // 文件上传：植物图片上传和删除
await fastify.register(helpFeedbackRoutes, { prefix: '/api/help-feedback' }); // 帮助与反馈

// ========================================
// 服务启动
// ========================================
const PORT = parseInt(process.env.PORT) || 3000; // 从环境变量读取端口，默认为 3000

try {
  // 监听所有网络接口，允许局域网访问
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server running on http://0.0.0.0:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// ========================================
// 优雅关闭处理
// 确保在服务停止时正确清理资源，避免数据丢失
// ========================================
const shutdown = async () => {
  await fastify.close();      // 关闭 HTTP 服务器
  await prisma.$disconnect(); // 断开数据库连接
  redis.disconnect();         // 断开 Redis 连接
  process.exit(0);
};

// 监听系统信号，实现优雅关闭
process.on('SIGTERM', shutdown); // Kubernetes/Docker 停止信号
process.on('SIGINT', shutdown);   // Ctrl+C 终止信号
