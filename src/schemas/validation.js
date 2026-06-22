/**
 * 数据验证 Schema 模块
 * 
 * 功能说明：
 * - 使用 Zod 库定义所有 API 请求数据的验证规则
 * - 确保后端接收到的数据格式正确、安全
 * - 提供清晰的错误提示
 * 
 * 使用方式：
 * 在路由处理器中使用 schema.parse(request.body) 验证请求数据
 */

import { z } from 'zod';

// ========================================
// 微信相关 Schema
// ========================================

/**
 * 微信授权码换取 Token 响应验证
 * 
 * @description
 * 定义微信 API 返回的 token 数据的结构
 * 用于确保从微信服务器获取的数据格式正确
 */
export const wechatTokenSchema = z.object({
  access_token: z.string(),     // 接口调用凭证
  expires_in: z.number(),        // 有效期（秒）
  refresh_token: z.string(),     // 刷新 token
  openid: z.string(),           // 用户唯一标识
  scope: z.string(),            // 用户授权的作用域
});

/**
 * 微信用户信息验证
 * 
 * @description
 * 定义从微信获取的用户基本信息结构
 */
export const wechatUserInfoSchema = z.object({
  openid: z.string(),           // 用户唯一标识
  nickname: z.string().optional(),     // 昵称（可能没有）
  headimgurl: z.string().optional(),  // 头像 URL（可能没有）
  unionid: z.string().optional(),      // 开放平台唯一标识（可能没有）
});

/**
 * 微信手机号响应验证
 * 
 * @description
 * 定义微信获取手机号 API 的响应结构
 * 
 * @deprecated
 * 微信已更新手机号获取接口，此 schema 可能需要更新
 */
export const wechatPhoneSchema = z.object({
  phoneInfo: z.object({
    phoneNumber: z.string(),           // 完整手机号
    purePhoneNumber: z.string(),       // 脱敏手机号
    countryCode: z.string(),           // 国家代码
    watermark: z.object({
      timestamp: z.number(),           // 时间戳
      appid: z.string(),               // 应用 AppID
    }),
  }),
});

// ========================================
// 用户相关 Schema
// ========================================

/**
 * 创建用户请求验证
 * 
 * @description
 * 用于用户创建或更新的数据验证
 * 所有字段都是可选的，因为更新时可能只更新部分字段
 */
export const createUserSchema = z.object({
  unionId: z.string().optional(),     // 微信 UnionID
  openId: z.string().optional(),      // 微信 OpenID
  phone: z.string().optional(),       // 手机号
  nickname: z.string().optional(),    // 昵称
  avatar: z.string().optional(),      // 头像 URL
});

// ========================================
// 植物相关 Schema
// ========================================

/**
 * 植物数据验证
 * 
 * @description
 * 用于创建新植物时的数据验证
 * 
 * 验证规则：
 * - name: 植物名称，1-50 个字符
 * - species: 植物种类，1-50 个字符
 * - frequency: 浇水频率（整数），1-365
 * - frequencyType: 频率类型，只能是 DAYS 或 TIMES_PER_DAY，必填
 * - image: 可选，图片 URL，必须是有效的 URL
 */
export const plantSchema = z.object({
  name: z.string().min(1).max(50),           // 植物名称：1-50 字符
  species: z.string().min(1).max(50),        // 植物种类：1-50 字符
  frequency: z.number().int().min(1).max(365),  // 浇水频率（整数）：1-365
  // 频率类型：
  // DAYS - 每 N 天浇水一次（frequency=7 表示每7天一次）
  // TIMES_PER_DAY - 每天浇水 N 次（frequency=2 表示每天2次）
  frequencyType: z.enum(['DAYS', 'TIMES_PER_DAY']),  // 必填，无默认值
  image: z.string().url().optional(),        // 可选：植物图片 URL
});

/**
 * 更新植物数据验证
 * 
 * @description
 * 用于更新植物信息的数据验证
 * 使用 plantSchema.partial() 使所有字段变为可选
 * 这样用户可以只更新部分字段
 */
export const updatePlantSchema = plantSchema.partial();

// ========================================
// AI 相关 Schema
// ========================================

/**
 * AI 养护建议请求验证
 * 
 * @description
 * 用于请求 AI 植物养护建议的数据验证
 * 
 * 验证规则：
 * - plantName: 必填，植物名称
 * - species: 必填，植物种类
 * - question: 可选，用户的问题
 */
export const aiTipSchema = z.object({
  plantName: z.string(),                      // 植物名称（必填）
  species: z.string(),                        // 植物种类（必填）
  question: z.string().optional(),            // 用户问题（可选）
});

// ========================================
// 浇水记录相关 Schema
// ========================================

/**
 * 浇水记录数据验证
 * 
 * @description
 * 用于创建浇水记录时的数据验证
 * 
 * 验证规则：
 * - plantId: 必填，植物 ID（整数）
 */
export const waterLogSchema = z.object({
  plantId: z.number().int().positive(),  // 植物 ID（必填，正整数）
});

// ========================================
// 帮助与反馈相关 Schema
// ========================================

/**
 * 意见反馈数据验证
 *
 * @description
 * 用于“我的-帮助与反馈”页面提交用户反馈。
 */
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'suggestion', 'other']),     // 反馈类型
  content: z.string().trim().min(1).max(1000),      // 反馈内容
  contact: z.string().trim().max(100).optional(),   // 联系方式（可选）
});
