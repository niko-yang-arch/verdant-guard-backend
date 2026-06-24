# 绿植渴了 - 后端项目

## 环境变量说明

```bash
# 数据库
DATABASE_URL=postgresql://verdant:your_password@postgres:5432/verdant_guard

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30d

# 微信登录
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 阿里云 OSS
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET=verdant-guard
OSS_REGION=cn-shanghai
OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com

# MiniMax AI
MINIMAX_API_KEY=your_minimax_api_key

# 服务
PORT=3000
NODE_ENV=production
```

## 快速启动

```bash
# 开发
docker compose up

# 生产
docker compose -f docker-compose.prod.yml up -d
```

## API 基础路径

- 开发环境: http://localhost:3000/api
- 所有请求需要 `Authorization: Bearer <token>` 头（除登录相关接口）
