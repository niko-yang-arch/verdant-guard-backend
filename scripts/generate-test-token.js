/**
 * 测试用 Token 生成脚本
 * 
 * 使用方式：
 * node scripts/generate-test-token.js
 */

import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const fastify = Fastify();

// 注册 JWT 插件
await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'secret-key-for-development-only-change-in-production',
});

// 创建测试用户
const testUser = await prisma.user.upsert({
  where: { unionId: 'test-union-id' },
  update: {},
  create: {
    openId: 'test-open-id',
    unionId: 'test-union-id',
    nickname: '测试用户',
    avatar: 'https://via.placeholder.com/150',
  }
});

// 生成 JWT Token
const token = fastify.jwt.sign({ userId: testUser.id });

console.log('✅ 测试用户创建成功！');
console.log('👤 用户 ID:', testUser.id);
console.log('🔐 JWT Token:\n');
console.log(token);
console.log('\n');
console.log('📋 使用方式：');
console.log('在请求头中添加：');
console.log(`Authorization: Bearer ${token}`);

await prisma.$disconnect();
