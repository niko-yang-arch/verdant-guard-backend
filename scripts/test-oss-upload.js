import { OSSService } from '../src/services/oss.js';
import * as dotenv from 'dotenv';

dotenv.config();

const oss = new OSSService({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  endpoint: process.env.OSS_ENDPOINT,
});

async function main() {
  try {
    const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const url = await oss.uploadImage(testBuffer, 'test.png', 'test-user');
    
    console.log('✅ OSS上传成功！');
    console.log('📤 图片URL:', url);
    
    await oss.deleteImage(url);
    console.log('🗑️ 测试图片已删除');
    
  } catch (error) {
    console.error('❌ OSS上传失败:', error.message);
    process.exit(1);
  }
}

main();
