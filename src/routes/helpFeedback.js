/**
 * 帮助与反馈路由模块
 *
 * API 端点：
 * - GET /api/help-feedback/config - 获取帮助页 FAQ、反馈类型和联系方式配置
 * - POST /api/help-feedback/submit - 提交用户反馈
 */

import { feedbackSchema } from '../schemas/validation.js';
import { authMiddleware } from '../middleware/auth.js';

const faqs = [
  {
    id: 'add-plant',
    question: '如何添加新的植物？',
    answer: '点击首页右下角的"+"按钮，进入添加植物页面。填写植物名称、种类和浇水频率，选择一张图片即可完成添加。',
  },
  {
    id: 'watering-reminder',
    question: '浇水提醒是如何工作的？',
    answer: '根据您设置的浇水频率，系统会在应该浇水的前一天发送通知提醒。确保在设置中开启了浇水提醒通知权限。',
  },
  {
    id: 'plant-limit',
    question: '可以同时管理多少棵植物？',
    answer: 'Verdant Guard 对植物数量没有限制，您可以添加任意数量的植物进行管理。',
  },
  {
    id: 'delete-plant',
    question: '如何删除一棵植物？',
    answer: '进入植物详情页，点击右上角的"..."菜单，选择删除选项。删除后该植物的所有浇水记录也会一并清除。',
  },
  {
    id: 'cloud-sync',
    question: '数据会自动同步吗？',
    answer: '是的，所有数据都会自动云端同步。换设备登录同一账号后，您的植物和浇水记录都会保留。',
  },
];

const feedbackTypes = [
  { label: '报告问题', value: 'bug' },
  { label: '功能建议', value: 'suggestion' },
  { label: '其他反馈', value: 'other' },
];

export default async function helpFeedbackRoutes(fastify, options) {
  fastify.get('/config', async (request, reply) => {
    return reply.success({
      faqs,
      feedbackTypes,
      supportEmail: 'support@verdantguard.com',
    });
  });

  fastify.post('/submit', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { userId } = request;
    const validated = feedbackSchema.parse(request.body);
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return reply.fail(401, 'Unauthorized');
    }

    const feedback = await fastify.prisma.feedback.create({
      data: {
        userId,
        type: validated.type,
        content: validated.content,
        contact: validated.contact || null,
        userAgent: request.headers['user-agent'] || null,
      },
    });

    return reply.success({
      id: feedback.id,
      status: 'submitted',
      submittedAt: feedback.createdAt,
    });
  });
}
