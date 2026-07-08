/**
 * 微信 API 服务封装
 * 
 * 功能说明：
 * - 提供微信 API 的封装，简化调用流程
 * - 支持小程序登录 code 换取 OpenID
 * - 获取用户手机号
 * 
 * 使用场景：
 * - 微信小程序用户登录
 * - 获取用户授权信息
 */

import axios from 'axios';

/**
 * 微信 API 服务类
 * 
 * @description
 * 封装微信开放平台 API，提供简洁的接口调用方式
 * 
 * @param {string} appid - 微信应用 AppID
 * @param {string} secret - 微信应用 AppSecret
 * 
 * @example
 * const wechat = new WechatService('wx123456789', 'abcdef123456');
 * const session = await wechat.getMiniProgramSessionByCode('wx.login 返回的 code');
 */
export class WechatService {
  constructor(appid, secret) {
    this.appid = appid;
    this.secret = secret;
  }

  // 微信小程序 code2session
  static WECHAT_CODE2SESSION_URL = 'https://api.weixin.qq.com/sns/jscode2session';
  // 获取手机号（已废弃，使用新接口）
  static WECHAT_PHONE_URL = 'https://api.weixin.qq.com/wxaplugin/getphone number';

  /**
   * 通过小程序 wx.login code 换取 OpenID 和 session_key
   * 
   * @param {string} code - 微信小程序调用 wx.login() 获取的授权码
   * @returns {Promise<Object>} 返回小程序会话数据
   * 
   * @description
   * 1. 将授权码发送到微信服务器
   * 2. 换取 OpenID（用户在当前小程序的唯一标识）
   * 3. 换取 session_key（服务端按需保存或用于解密敏感信息）
   * 
   * @returns {Object} 包含以下字段：
   * - openid: 用户唯一标识
   * - session_key: 会话密钥
   * - unionid: 用户在开放平台的唯一标识符（满足条件时返回）
   */
  async getMiniProgramSessionByCode(code) {
    const { data } = await axios.get(WechatService.WECHAT_CODE2SESSION_URL, {
      params: {
        appid: this.appid,
        secret: this.secret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });
    return data;
  }

  /**
   * 获取用户手机号（已废弃）
   * 
   * @param {string} accessToken - 接口调用凭证
   * @param {string} code - 手机号获取凭证
   * @returns {Promise<Object>} 返回手机号信息
   * 
   * @deprecated
   * 微信已更新手机号获取接口，请使用新的 button 组件方式
   * 
   * @description
   * 通过 Access Token 和 code 获取用户绑定的手机号
   * 
   * @returns {Object} 包含以下字段：
   * - phoneInfo.phoneNumber: 绑定的手机号
   * - phoneInfo.purePhoneNumber: 脱敏手机号
   * - phoneInfo.countryCode: 国家代码
   */
  async getPhoneNumber(accessToken, code) {
    const { data } = await axios.post(
      WechatService.WECHAT_PHONE_URL,
      { code },
      { params: { access_token: accessToken } }
    );
    return data;
  }
}
