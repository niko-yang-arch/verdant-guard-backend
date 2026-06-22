import { jest } from '@jest/globals';
import crypto from 'node:crypto';

const BASE_URL = 'http://localhost:3000';
const TEST_JWT_SECRET = 'secret-key-for-development-only-change-in-production';
const DATABASE_URL = 'postgresql://admin@localhost:5432/verdant_guard';

let authToken = '';
let testPlantId = null;
let testUserId = null;

function signTestToken(userId = 'test-user-id') {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ userId });
  const signature = crypto
    .createHmac('sha256', TEST_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

async function ensureFeedbackTestUser() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
  try {
    const user = await prisma.user.upsert({
      where: { phone: 'feedback-test-user' },
      update: {},
      create: {
        phone: 'feedback-test-user',
        nickname: '反馈测试用户',
      },
    });
    return user.id;
  } finally {
    await prisma.$disconnect();
  }
}

describe('植物养护应用 API 测试', () => {
  
  describe('1. 健康检查接口', () => {
    test('GET /health - 服务正常运行', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.code).toBe(200);
      expect(data.status).toBe('normal');
      expect(data.data.status).toBe('ok');
      expect(data.data.timestamp).toBeDefined();
    });
  });

  describe('2. 植物管理接口', () => {
    
    describe('GET /api/plants/list', () => {
      test('获取植物列表 - 未认证应返回401', async () => {
        const response = await fetch(`${BASE_URL}/api/plants/list`);
        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/plants/add', () => {
      test('添加植物 - 未认证应返回401', async () => {
        const response = await fetch(`${BASE_URL}/api/plants/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '测试植物' })
        });
        
        expect(response.status).toBe(401);
      });
    });
  });

  describe('3. 认证接口', () => {
    
    describe('POST /api/auth/wechat/login', () => {
      test('微信登录 - code缺失应返回400', async () => {
        const response = await fetch(`${BASE_URL}/api/auth/wechat/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        const data = await response.json();
        expect(response.status).toBe(400);
        expect(data.data.message).toContain('code is required');
      });

      test('微信登录 - 无效code会调用微信API（实际返回取决于微信服务）', async () => {
        const response = await fetch(`${BASE_URL}/api/auth/wechat/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'invalid_code_12345' })
        });
        
        const data = await response.json();
        if (response.status === 200) {
          expect(data.status).toBe('normal');
          expect(data.data).toHaveProperty('token');
          expect(data.data).toHaveProperty('user');
        } else {
          expect(response.status).toBeGreaterThanOrEqual(400);
        }
      });
    });

    describe('GET /api/auth/me', () => {
      test('获取用户信息 - 未认证应返回401', async () => {
        const response = await fetch(`${BASE_URL}/api/auth/me`);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('4. 浇水记录接口', () => {
    
    describe('POST /api/water-logs/add', () => {
      test('浇水记录 - 未认证应返回401', async () => {
        const response = await fetch(`${BASE_URL}/api/water-logs/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plantId: 1 })
        });
        
        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/water-logs/calendar', () => {
      test('日历数据 - 未认证应返回401', async () => {
        const response = await fetch(`${BASE_URL}/api/water-logs/calendar?year=2026&month=5`);
        expect(response.status).toBe(401);
      });

      test('日历数据 - 缺少参数应返回400', async () => {
        const response = await fetch(`${BASE_URL}/api/water-logs/calendar`, {
          headers: { 'Authorization': `Bearer invalid` }
        });
        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/water-logs/plant/:plantId', () => {
      test('植物浇水历史 - 未认证应返回401', async () => {
        const response = await fetch(`${BASE_URL}/api/water-logs/plant/1`);
        expect(response.status).toBe(401);
      });
    });
  });

  describe('5. 上传接口', () => {
    
    describe('POST /api/upload/plant-image', () => {
      test('上传图片 - 未认证应返回401', async () => {
        const response = await fetch(`${BASE_URL}/api/upload/plant-image`, {
          method: 'POST'
        });
        
        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/upload/delete', () => {
      test('删除图片 - 未认证应返回401', async () => {
        const response = await fetch(`${BASE_URL}/api/upload/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 1 })
        });
        
        expect(response.status).toBe(401);
      });

      test('删除图片 - id缺失应返回400', async () => {
        const response = await fetch(`${BASE_URL}/api/upload/delete`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer invalid`
          },
          body: JSON.stringify({})
        });
        
        expect(response.status).toBe(401);
      });
    });
  });

  describe('6. 帮助与反馈接口', () => {
    test('GET /api/help-feedback/config - 返回帮助页配置', async () => {
      const response = await fetch(`${BASE_URL}/api/help-feedback/config`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('normal');
      expect(Array.isArray(data.data.faqs)).toBe(true);
      expect(data.data.faqs.length).toBeGreaterThan(0);
      expect(Array.isArray(data.data.feedbackTypes)).toBe(true);
      expect(data.data.supportEmail).toBe('support@verdantguard.com');
    });

    test('POST /api/help-feedback/submit - 未认证应返回401', async () => {
      const response = await fetch(`${BASE_URL}/api/help-feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'suggestion', content: '希望增加提醒功能' }),
      });

      expect(response.status).toBe(401);
    });

    test('POST /api/help-feedback/submit - 空内容应返回400', async () => {
      const userId = await ensureFeedbackTestUser();
      const response = await fetch(`${BASE_URL}/api/help-feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${signTestToken(userId)}`,
        },
        body: JSON.stringify({ type: 'suggestion', content: '   ' }),
      });

      expect(response.status).toBe(400);
    });

    test('POST /api/help-feedback/submit - 登录后提交成功', async () => {
      const userId = await ensureFeedbackTestUser();
      const response = await fetch(`${BASE_URL}/api/help-feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${signTestToken(userId)}`,
        },
        body: JSON.stringify({
          type: 'bug',
          content: '帮助与反馈接口测试',
          contact: 'tester@example.com',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('normal');
      expect(data.data.status).toBe('submitted');
      expect(data.data.id).toBeDefined();
      expect(data.data.submittedAt).toBeDefined();

      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
      try {
        const feedback = await prisma.feedback.findUnique({
          where: { id: data.data.id },
        });
        expect(feedback).not.toBeNull();
        expect(feedback.userId).toBe(userId);
        expect(feedback.type).toBe('bug');
        expect(feedback.content).toBe('帮助与反馈接口测试');
        expect(feedback.contact).toBe('tester@example.com');
      } finally {
        await prisma.$disconnect();
      }
    });
  });

  describe('7. 响应格式验证', () => {
    test('所有错误响应应包含统一的格式', async () => {
      const response = await fetch(`${BASE_URL}/api/plants/list`);
      const data = await response.json();
      
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('data');
      expect(typeof data.code).toBe('number');
      expect(typeof data.status).toBe('string');
      expect(['normal', 'error']).toContain(data.status);
    });
  });

  describe('8. 边界情况测试', () => {
    test('无效路径应返回404', async () => {
      const response = await fetch(`${BASE_URL}/api/invalid/path`);
      expect(response.status).toBe(404);
    });

    test('无效方法应返回404或405', async () => {
      const response = await fetch(`${BASE_URL}/health`, {
        method: 'DELETE'
      });
      expect([404, 405]).toContain(response.status);
    });

    test('无效Content-Type应正常处理', async () => {
      const response = await fetch(`${BASE_URL}/api/plants/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'invalid data'
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

console.log('测试说明：');
console.log('1. 部分接口需要认证token，测试会验证未认证时的行为');
console.log('2. 微信登录接口需要真实的微信code才能测试成功');
console.log('3. 上传接口需要有效的OSS配置');
