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
    answer: '在首页点击右上角的绿色"+"按钮进入"添加新植物"页面。您可以上传植物图片，填写植物名称、植物种类，选择"单次/多天一次"或"一天多次"的浇水频率，最后保存即可。',
  },
  {
    id: 'watering-reminder',
    question: '浇水提醒是如何工作的？',
    answer: '系统会根据每株植物设置的浇水频率计算状态。首页会在"今日提醒"中显示今天需要浇水的植物，植物卡片和详情页也会显示"今天需要浇水"、"明天需要浇水"或"还有几天浇水"。',
  },
  {
    id: 'plant-limit',
    question: '可以同时管理多少棵植物？',
    answer: '目前界面没有设置植物数量上限。添加后的植物会出现在首页"我的植物"列表中，也可以通过顶部搜索框按植物名称或种类快速查找。',
  },
  {
    id: 'delete-plant',
    question: '如何删除一棵植物？',
    answer: '在首页点击植物卡片进入详情页，点击底部左侧的垃圾桶按钮，然后在弹窗中点击"确认删除"。删除后会同步清除该植物的所有浇水记录，且无法恢复。',
  },
  {
    id: 'cloud-sync',
    question: '数据会自动同步吗？',
    answer: '会。登录后，新增植物、编辑信息、记录浇水和删除植物都会保存到云端；重新进入应用或换设备登录同一账号后，会自动拉取您的植物和浇水记录。',
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
      supportEmail: '296831450@qq.com',
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
