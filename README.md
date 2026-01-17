# Server Monitor

一个现代化的全栈服务器监控应用

## 技术栈

### 前端
- React 18
- Rsbuild
- Ant Design v5
- React Router v6
- TypeScript

### 后端
- Hono.js
- Node.js v20 LTS
- TypeScript
- systeminformation

### 基础设施
- MySQL 8
- Nginx
- Docker & Docker Compose

## 快速开始

### 环境要求
- Docker & Docker Compose
- Node.js v20 LTS (仅用于本地开发)

### 开发环境

```bash
# 复制环境变量文件
cp .env.example .env

# 启动开发环境
make dev-up

# 查看日志
make dev-logs

# 停止开发环境
make dev-down
```

### 生产环境

```bash
# 启动生产环境
make prod-up

# 查看日志
make prod-logs

# 停止生产环境
make prod-down
```

## 端口映射

| 服务 | 宿主机端口 | 说明 |
|------|-----------|------|
| Frontend (Dev) | 26000 | 开发时前端访问 |
| Backend API | 26001 | 后端 API |
| MySQL | 26002 | 数据库连接 |
| Nginx | 26003 | 统一入口（生产） |

## 项目结构

```
.
├── frontend/          # React 前端
├── backend/           # Hono.js 后端
├── database/          # 数据库初始化脚本
├── nginx/             # Nginx 配置
├── docker compose.yml # 开发环境配置
├── docker compose.prod.yml # 生产环境配置
└── Makefile          # 自动化命令
```

## 开发指南

详见各子项目的 README 文件
