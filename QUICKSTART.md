# 快速启动指南

## 🚀 立即开始

### 1. 启动开发环境

```bash
# 方式1: 使用 Makefile（推荐）
make dev-up

# 方式2: 直接使用 Docker Compose
docker compose up -d
```

### 2. 查看服务状态

```bash
make status
# 或
docker compose ps
```

### 3. 访问应用

等待所有服务启动完成（约 30-60 秒），然后访问：

- **前端界面**: http://localhost:26000
- **后端 API**: http://localhost:26001/api/system-info
- **健康检查**: http://localhost:26001/health

### 4. 查看日志

```bash
# 查看所有服务日志
make dev-logs

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

### 5. 停止环境

```bash
make dev-down
# 或
docker compose down
```

---

## 📊 数据库访问

### 使用 Makefile 进入 MySQL

```bash
make db-shell
```

### 使用 DataGrip 或其他工具连接

**连接信息**:
- Host: `localhost`
- Port: `26002`
- User: `root`
- Password: 见 `.env` 文件中的 `MYSQL_ROOT_PASSWORD`
- Database: `server_monitor`

---

## 🏭 生产环境部署

### 1. 更新环境变量

编辑 `.env` 文件，修改密码和配置：

```bash
# 修改为强密码
MYSQL_ROOT_PASSWORD=your_strong_password_here
MYSQL_PASSWORD=your_monitor_password_here
```

### 2. 启动生产环境

```bash
make prod-up
```

### 3. 访问应用

通过 Nginx 统一入口访问：
- **应用入口**: http://localhost:26003

---

## 🔧 常见问题

### 系统信息显示为 Alpine Linux？

这是正常现象。

1.  **Mac / Windows**: Docker 运行在一个轻量级 Linux 虚拟机中（通常是 Alpine Linux）。后端服务获取的是这个虚拟机的信息，无法穿透获取宿主机（macOS/Windows）的硬件信息。
2.  **Linux 服务器**: 在生产环境部署时，我们已在 `docker compose.prod.yml` 中配置了 `pid: host` 和 `privileged: true`。这允许容器访问宿主机的 `/proc` 文件系统，从而获取真实的宿主机 CPU、内存和磁盘信息。

### 端口被占用

如果端口已被占用，修改 `.env` 文件中的端口号：

```bash
FRONTEND_PORT=26000  # 修改为其他端口
BACKEND_PORT=26001   # 修改为其他端口
MYSQL_PORT=26002     # 修改为其他端口
NGINX_PORT=26003     # 修改为其他端口
```

### 容器启动失败

```bash
# 查看详细日志
docker compose logs

# 重建容器
make dev-rebuild
```

### 数据库连接失败

1. 确保 MySQL 容器已完全启动
2. 检查 `.env` 中的数据库配置
3. 查看后端日志：`docker compose logs backend`

### 前端无法连接后端

1. 检查后端是否正常运行：访问 http://localhost:26001/health
2. 确认前端 `.env` 中的 API URL 配置正确
3. 检查浏览器控制台是否有 CORS 错误

---

## 📝 开发提示

### 本地开发（不使用 Docker）

#### 前端
```bash
cd frontend
npm install
npm run dev
```

#### 后端
```bash  
cd backend
npm install
npm run dev
```

### 热重载

开发环境已配置热重载：
- 前端：修改 `frontend/src` 下的文件会自动刷新
- 后端：修改 `backend/src` 下的文件会自动重启

---

## 🎯 下一步

1. ✅ 启动开发环境
2. ✅ 访问 http://localhost:26000 查看界面
3. ✅ 测试服务器信息显示是否正常
4. ✅ 尝试数据库连接
5. ⭐ 开始添加自定义功能！

---

## 🆘 需要帮助？

查看完整文档：
- [项目总结](walkthrough.md)
- [实施计划](implementation_plan.md)
- [任务清单](task.md)
- [项目 README](../README.md)

或运行：
```bash
make help
```
