# 1. 在所有阶段之前定义变量
ARG NODE_IMAGE=registry.cn-hangzhou.aliyuncs.com/fubd_own/node:20-slim

# --- 开发阶段 ---
FROM ${NODE_IMAGE} AS development
WORKDIR /app
COPY package*.json ./
# 使用 cache mount 加速依赖安装
RUN --mount=type=cache,target=/root/.npm \
    npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# --- 生产构建阶段 ---
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY package*.json ./
# 使用 cache mount 并使用 ci 安装确定的版本
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

# --- 生产运行阶段 ---
FROM ${NODE_IMAGE} AS production
WORKDIR /app
COPY package*.json ./
# 仅安装生产依赖，并清理缓存减少镜像体积
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production && \
    npm cache clean --force

# 从 builder 阶段拷贝构建产物
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["npm", "start"]