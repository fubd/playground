# 1. 在所有阶段之前定义变量
ARG NODE_IMAGE=registry.cn-hangzhou.aliyuncs.com/fubd_own/node:20-slim

# --- 开发阶段 ---
FROM ${NODE_IMAGE} AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# --- 生产构建阶段 ---
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY package*.json ./
# 注意：这里如果为了构建速度，通常也需要执行 npm install 或 ci
RUN npm ci
COPY . .
RUN npm run build

# --- 生产运行阶段 ---
FROM ${NODE_IMAGE} AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 从 builder 阶段拷贝构建产物
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["npm", "start"]