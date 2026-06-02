# 多阶段构建：构建阶段 + 运行阶段分离
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY . .

# 运行阶段
FROM node:22-alpine

WORKDIR /app

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]