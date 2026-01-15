# 1. 定义私有镜像地址变量
ARG NODE_IMAGE=registry.cn-hangzhou.aliyuncs.com/fubd_own/node:20-slim
ARG NGINX_IMAGE=registry.cn-hangzhou.aliyuncs.com/fubd_own/nginx:alpine

# --- 开发阶段 ---
FROM ${NODE_IMAGE} AS development
WORKDIR /app
COPY package*.json ./
# 开发环境通常需要频繁变更，使用 install 并挂载缓存
RUN --mount=type=cache,target=/root/.npm \
    npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- 生产构建阶段 ---
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY package*.json ./
# 生产构建使用 ci 保证 lock 文件一致性，并利用缓存
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

# --- 生产运行阶段 ---
FROM ${NGINX_IMAGE} AS production

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 配置 Nginx (这里保持你原来的逻辑)
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]