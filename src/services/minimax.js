/**
 * MiniMax AI 服务封装
 * 
 * 功能说明：
 * - 提供 MiniMax 大语言模型的封装
 * - 支持生成植物养护建议
 * - 统一的 API 调用接口
 * 
 * 使用场景：
 * - AI 智能植物养护助手
 * - 植物问题咨询
 */

import axios from 'axios';

/**
 * MiniMax AI 服务类
 * 
 * @description
 * 封装 MiniMax API，提供简洁的接口调用方式
 * 使用文本补全 API 生成 AI 响应
 * 
 * @param {string} apiKey - MiniMax API 密钥
 * 
 * @example
 * const minimax = new MiniMaxService('your-api-key');
 * const result = await minimax.generatePlantTips('发财树', '绿萝', '叶子发黄怎么办？');
 */
export class MiniMaxService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // MiniMax API 基础 URL
    this.baseURL = 'https://api.minimaxi.com/v1';
  }

  /**
   * 通用内容生成方法
   * 
   * @param {string} model - 模型名称（如 'abab6.5s'）
   * @param {string} contents - 用户输入内容
   * @param {string} systemInstruction - 系统指令（可选）
   * @returns {Promise<Object>} 返回 AI 响应
   * 
   * @description
   * 通用的 AI 内容生成接口
   * 支持自定义系统指令来控制 AI 的行为和输出格式
   * 
   * @example
   * const result = await minimax.generateContent(
   *   'abab6.5s',
   *   '你好，请介绍一下自己',
   *   '你是一个友好的助手，用中文回答'
   * );
   */
  async generateContent(model, contents, systemInstruction) {
    // 构建消息数组
    const messages = [];
    
    // 如果有系统指令，添加到消息数组开头
    // 系统指令用于设定 AI 的角色和行为
    if (systemInstruction) {
      messages.push({
        role: 'system',
        content: systemInstruction
      });
    }
    
    // 添加用户输入
    messages.push({
      role: 'user',
      content: contents
    });

    // 调用 MiniMax 文本补全 API
    const { data } = await axios.post(
      `${this.baseURL}/text/chatcompletion_v2`,
      {
        model,           // 模型名称
        messages,        // 对话消息数组
      },
      {
        headers: {
          // Bearer Token 认证
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        // 请求超时时间：30 秒
        timeout: 30000,
      }
    );

    return data;
  }

  /**
   * 生成植物养护建议
   * 
   * @param {string} plantName - 植物名称（如"小明的绿萝"）
   * @param {string} species - 植物种类（如"绿萝"）
   * @param {string} question - 用户问题（可选）
   * @returns {Promise<string>} 返回养护建议文本
   * 
   * @description
   * 根据植物名称、种类和用户问题，生成专业的植物养护建议
   * 
   * 功能说明：
   * 1. 如果用户提供了具体问题，返回针对该问题的回答
   * 2. 如果没有提供问题，返回通用的养护建议（3 条）
   * 3. 建议控制在 150 字以内
   * 
   * AI 角色设定：
   * - 专业的植物学家
   * - 亲切且科学的语气
   * - 简洁、分条列出
   */
  async generatePlantTips(plantName, species, question) {
    // 构建用户输入
    // 根据是否有问题，使用不同的提示词
    const prompt = question
      // 如果用户有具体问题，直接提问
      ? `用户咨询关于 ${plantName} (${species}) 的问题：${question}`
      // 如果没有，提供通用养护建议
      : `请为绿植 ${plantName} (${species}) 提供 3 条简洁专业的养护建议，控制在 150 字以内。`;

    // 系统指令：设定 AI 的角色和行为
    // 专业的植物学家 + 亲切科学的语气 + 简洁分条
    const systemInstruction = '你是一个专业的植物学家。请用中文回答，语气亲切且科学。回答要简洁，分条列出。';

    // 调用 AI 生成内容
    const response = await this.generateContent(
      'abab6.5s',  // MiniMax 模型名称
      prompt,
      systemInstruction
    );

    // 提取 AI 的回复文本
    // 响应结构：response.choices[0].message.content
    const text = response.choices?.[0]?.message?.content;
    
    // 如果 AI 没有返回内容，返回友好的错误提示
    if (!text) {
      return '抱歉，AI 助手暂时走开了。';
    }

    return text;
  }
}
