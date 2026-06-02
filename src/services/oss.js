/**
 * 阿里云 OSS（对象存储）服务封装
 * 
 * 功能说明：
 * - 提供文件上传到阿里云 OSS 的功能
 * - 支持文件删除
 * - 自动处理 CDN 加速 URL
 * 
 * 使用场景：
 * - 植物图片存储
 * - 用户上传文件管理
 */

import OSS from 'ali-oss';

/**
 * 阿里云 OSS 服务类
 * 
 * @description
 * 封装阿里云 OSS SDK，提供简洁的文件上传和删除接口
 * 
 * @param {Object} options - OSS 配置选项
 * @param {string} options.region - OSS 数据中心区域（如 'oss-cn-shanghai'）
 * @param {string} options.accessKeyId - 访问密钥 ID
 * @param {string} options.accessKeySecret - 访问密钥密钥
 * @param {string} options.bucket - OSS 存储桶名称
 * @param {string} options.endpoint - OSS 访问端点
 * 
 * @example
 * const oss = new OSSService({
 *   region: 'oss-cn-shanghai',
 *   accessKeyId: 'your-access-key-id',
 *   accessKeySecret: 'your-access-key-secret',
 *   bucket: 'my-bucket',
 *   endpoint: 'https://oss-cn-shanghai.aliyuncs.com'
 * });
 */
export class OSSService {
  constructor(options) {
    const clientOptions = {
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret,
      bucket: options.bucket,
    };
    
    if (options.endpoint) {
      clientOptions.endpoint = options.endpoint;
    } else if (options.region) {
      clientOptions.region = options.region;
    }
    
    this.client = new OSS(clientOptions);
    this.bucket = options.bucket;
  }

  /**
   * 上传图片到 OSS
   * 
   * @param {Buffer} buffer - 文件内容的二进制缓冲区
   * @param {string} filename - 原始文件名（用于提取文件扩展名）
   * @param {string} userId - 用户 ID（用于目录隔离）
   * @returns {Promise<string>} 返回文件的 CDN URL
   * 
   * @description
   * 将图片上传到阿里云 OSS，存储路径按用户隔离
   * 
   * 存储路径格式：
   * plants/{userId}/{timestamp}.{ext}
   * 例如：plants/user123/1708765432100.jpg
   * 
   * 优势：
   * 1. 按用户 ID 隔离，避免文件冲突
   * 2. 使用时间戳命名，保证唯一性
   * 3. 自动获取 CDN 加速 URL
   */
  async uploadImage(buffer, filename, userId) {
    // 提取文件扩展名
    // 如果文件名没有扩展名，默认使用 'jpg'
    const ext = filename.split('.').pop() || 'jpg';

    // 构建 OSS 存储路径
    // 格式：plants/{userId}/{timestamp}.{ext}
    // userId 用于目录隔离
    // timestamp 确保文件名唯一
    const objectKey = `plants/${userId}/${Date.now()}.${ext}`;

    // 上传到 OSS
    const result = await this.client.put(objectKey, buffer, {
      headers: {
        // 设置 Content-Type，确保浏览器正确识别文件类型
        'Content-Type': `image/${ext}`,
      },
    });

    // 返回 CDN 地址
    // 注意：需要在阿里云控制台为该 bucket 配置 CDN 加速
    // CDN 可以提升文件访问速度，减轻 OSS 压力
    return result.url;
  }

  /**
   * 删除 OSS 上的文件
   * 
   * @param {string} url - 文件的完整 URL
   * @returns {Promise<void>}
   * 
   * @description
   * 根据文件的 CDN URL，删除 OSS 上的对应文件
   * 
   * 使用场景：
   * - 用户删除植物时，同时删除关联的图片
   * - 用户更换植物头像时，删除旧图片
   */
  async deleteImage(url) {
    // 从 URL 中提取 OSS 对象路径
    // URL 格式：https://bucket.endpoint/objectKey
    const objectKey = this.extractObjectKey(url);
    
    // 如果无法提取对象路径（URL 格式不正确），直接返回
    if (!objectKey) return;

    // 调用 OSS API 删除文件
    await this.client.delete(objectKey);
  }

  /**
   * 从 URL 中提取 OSS 对象路径（Object Key）
   * 
   * @param {string} url - 文件的完整 URL
   * @returns {string|null} 返回对象路径，或 null（如果提取失败）
   * 
   * @description
   * 从 CDN URL 中提取 OSS 对象的存储路径
   * 
   * 示例：
   * 输入：https://my-bucket.oss-cn-shanghai.aliyuncs.com/plants/user123/1708765432100.jpg
   * 输出：plants/user123/1708765432100.jpg
   */
  extractObjectKey(url) {
    try {
      // 解析 URL
      const urlObj = new URL(url);
      // 获取路径部分，并移除开头的斜杠
      // pathname 格式：/bucket/objectKey
      // 移除 / 后得到：bucket/objectKey
      // 再移除 bucket/ 得到：objectKey
      return urlObj.pathname.slice(1);
    } catch {
      // URL 格式错误，返回 null
      return null;
    }
  }
}
