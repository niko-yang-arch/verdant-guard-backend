/**
 * 微信 API 服务封装
 * 
 * 功能说明：
 * - 提供微信 API 的封装，简化调用流程
 * - 支持授权码换取 Access Token
 * - 获取用户基本信息
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
 * const tokenData = await wechat.getAccessTokenByCode('微信返回的授权码');
 */
export class WechatService {
  constructor(appid, secret) {
    this.appid = appid;
    this.secret = secret;
  }

  // 微信 API 端点
  // 换取 Access Token
  static WECHAT_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token';
  // 获取用户信息
  static WECHAT_USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo';
  // 获取手机号（已废弃，使用新接口）
  static WECHAT_PHONE_URL = 'https://api.weixin.qq.com/wxaplugin/getphone number';

  /**
   * 通过授权码换取 Access Token 和 OpenID
   * 
   * @param {string} code - 微信小程序调用 wx.login() 获取的授权码
   * @returns {Promise<Object>} 返回 token 数据
   * 
   * @description
   * 1. 将授权码发送到微信服务器
   * 2. 换取 Access Token（用于后续 API 调用）
   * 3. 获取 OpenID（用户在当前小程序的唯一标识）
   * 
   * @returns {Object} 包含以下字段：
   * - access_token: 接口调用凭证
   * - expires_in: 有效期（秒）
   * - refresh_token: 刷新 token
   * - openid: 用户唯一标识
   * - scope: 用户授权的作用域
   */
  async getAccessTokenByCode(code) {
    const { data } = await axios.get(WechatService.WECHAT_TOKEN_URL, {
      params: {
        appid: this.appid,
        secret: this.secret,
        code,
        grant_type: 'authorization_code',
      },
    });
    return data;
  }

  /**
   * 获取用户基本信息
   * 
   * @param {string} accessToken - 接口调用凭证
   * @param {string} openid - 用户唯一标识
   * @returns {Promise<Object>} 返回用户信息
   * 
   * @description
   * 通过 Access Token 和 OpenID 获取用户的基本信息
   * 包括昵称、头像、UnionID 等
   * 
   * @returns {Object} 包含以下字段：
   * - openid: 用户唯一标识
   * - nickname: 微信昵称
   * - sex: 性别（1:男，2:女，0:未知）
   * - province: 省份
   * - city: 城市
   * - country: 国家
   * - headimgurl: 头像 URL
   * - unionid: 用户在开放平台的唯一标识符
   */
  async getUserInfo(accessToken, openid) {
    const { data } = await axios.get(WechatService.WECHAT_USERINFO_URL, {
      params: { 
        access_token: accessToken,
        openid 
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
