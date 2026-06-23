/**
 * 文件上传路由模块
 * 
 * 功能说明：
 * - 植物图片上传到阿里云 OSS
 * - 图片删除功能
 * - 所有操作需要用户登录认证
 * 
 * API 端点：
 * - POST /api/upload/plant-image - 上传植物图片
 * - POST /api/upload/delete - 删除植物图片
 */

import { authMiddleware } from '../middleware/auth.js';
import { OSSService } from '../services/oss.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 初始化阿里云 OSS 服务
const oss = new OSSService({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  endpoint: process.env.OSS_ENDPOINT,
});

export default async function uploadRoutes(fastify, options) {
  
  fastify.addHook('preHandler', authMiddleware);

  // 上传植物图片
  fastify.post('/plant-image', async (request, reply) => {
    const { userId } = request;
    const data = await request.file();
    
    if (!data) {
      return reply.fail(400, 'No file uploaded');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.fail(400, 'Unsupported file type');
    }

    const buffer = await data.toBuffer();

    if (buffer.length > 5 * 1024 * 1024) {
      return reply.fail(400, 'File too large (max 5MB)');
    }

    const url = await oss.uploadImage(buffer, data.filename, userId);

    const image = await prisma.image.create({
      data: {
        userId,
        url,
        type: 'PLANT'
      }
    });

    return reply.success({ id: image.id, url });
  });

  // 删除植物图片 - 通过ID删除
  fastify.post('/delete', async (request, reply) => {
    const { userId } = request;
    const { id } = request.body;

    if (!id) {
      return reply.fail(400, 'id is required');
    }

    try {
      const image = await prisma.image.findFirst({
        where: { id, userId }
      });

      if (!image) {
        return reply.fail(404, 'Image not found');
      }

      await oss.deleteImage(image.url);
      await prisma.image.delete({ where: { id } });

      return reply.success({ success: true });
    } catch (err) {
      fastify.log.error('Failed to delete image:', err);
      return reply.fail(500, 'Failed to delete image');
    }
  });
}
