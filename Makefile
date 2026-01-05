.PHONY: help dev-up dev-down dev-logs dev-rebuild dev-restart prod-up prod-down prod-logs prod-rebuild prod-restart db-shell db-backup db-restore clean status install-deps sync-deps

# 默认目标
help:
	@echo "Server Monitor - 可用命令:"
	@echo ""
	@echo "开发环境:"
	@echo "  make dev-up          - 启动开发环境"
	@echo "  make dev-down        - 停止开发环境"
	@echo "  make dev-logs        - 查看开发环境日志"
	@echo "  make dev-rebuild     - 重建并启动开发环境"
	@echo "  make dev-restart     - 重启开发环境服务"
	@echo ""
	@echo "生产环境:"
	@echo "  make prod-up         - 启动生产环境"
	@echo "  make prod-down       - 停止生产环境"
	@echo "  make prod-logs       - 查看生产环境日志"
	@echo "  make prod-rebuild    - 重建并启动生产环境"
	@echo "  make prod-restart    - 重启生产环境服务"
	@echo ""
	@echo "数据库:"
	@echo "  make db-shell        - 进入 MySQL Shell"
	@echo "  make db-backup       - 备份数据库"
	@echo "  make db-restore      - 恢复数据库 (需要 BACKUP_FILE 参数)"
	@echo ""
	@echo "工具:"
	@echo "  make install-deps    - 安装本地开发依赖"
	@echo "  make clean           - 清理所有容器、卷和镜像"
	@echo "  make status          - 查看服务状态"

# ==================== 开发环境 ====================

dev-up:
	@echo "🚀 启动开发环境..."
	docker compose up -d
	@echo "✓ 开发环境已启动"
	@echo "📍 前端: http://localhost:26030"
	@echo "📍 后端: http://localhost:26031"
	@echo "📍 MySQL: localhost:26032"

dev-down:
	@echo "🛑 停止开发环境..."
	docker compose down
	@echo "✓ 开发环境已停止"

dev-logs:
	docker compose logs -f

dev-rebuild:
	@echo "🔨 重建开发环境..."
	docker compose down
	docker compose build --no-cache
	docker compose up -d
	@echo "✓ 开发环境重建完成"

dev-restart:
	@echo "🔄 重启开发环境服务..."
	docker compose restart
	@echo "✓ 服务已重启"

# ==================== 生产环境 ====================

prod-up:
	@echo "🚀 启动生产环境..."
	docker compose -f docker compose.prod.yml up -d
	@echo "✓ 生产环境已启动"
	@echo "📍 Nginx (统一入口): http://localhost:26033"
	@echo "📍 后端 API: http://localhost:26031"
	@echo "📍 MySQL: localhost:26032"

prod-down:
	@echo "🛑 停止生产环境..."
	docker compose -f docker compose.prod.yml down
	@echo "✓ 生产环境已停止"

prod-logs:
	docker compose -f docker compose.prod.yml logs -f

prod-rebuild:
	@echo "🔨 重建生产环境..."
	docker compose -f docker compose.prod.yml down
	docker compose -f docker compose.prod.yml build --no-cache
	docker compose -f docker compose.prod.yml up -d
	@echo "✓ 生产环境重建完成"

prod-restart:
	@echo "🔄 重启生产环境服务..."
	docker compose -f docker compose.prod.yml restart
	@echo "✓ 服务已重启"

# ==================== 数据库操作 ====================

db-shell:
	@echo "📊 连接到 MySQL Shell..."
	@docker exec -it $$(docker ps -qf "name=mysql") mysql -uroot -p$$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) server_monitor

db-backup:
	@echo "💾 备份数据库..."
	@mkdir -p ./backups
	@docker exec $$(docker ps -qf "name=mysql") mysqldump -uroot -p$$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) server_monitor > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✓ 数据库已备份到 ./backups/"

db-restore:
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ 错误: 请指定备份文件"; \
		echo "用法: make db-restore BACKUP_FILE=backups/backup_20260102_120000.sql"; \
		exit 1; \
	fi
	@echo "📥 恢复数据库从 $(BACKUP_FILE)..."
	@docker exec -i $$(docker ps -qf "name=mysql") mysql -uroot -p$$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2) server_monitor < $(BACKUP_FILE)
	@echo "✓ 数据库已恢复"

# ==================== 工具命令 ====================

install-deps:
	@echo "📦 安装前端依赖..."
	cd frontend && npm install
	@echo "📦 安装后端依赖..."
	cd backend && npm install
	@echo "✓ 依赖安装完成"

sync-deps:
	@echo "🔄 从容器同步 node_modules 到宿主机..."
	docker cp server-monitor-backend-dev:/app/node_modules ./backend/
	docker cp server-monitor-frontend-dev:/app/node_modules ./frontend/
	@echo "✓ 同步完成"

clean:
	@echo "🧹 清理所有容器、卷和镜像..."
	@read -p "⚠️  这将删除所有容器、卷和数据。确定继续？(y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v --rmi all; \
		docker compose -f docker compose.prod.yml down -v --rmi all; \
		echo "✓ 清理完成"; \
	else \
		echo "❌ 已取消"; \
	fi

status:
	@echo "📊 服务状态:"
	@docker compose ps
	@echo ""
	@echo "📊 生产环境状态:"
	@docker compose -f docker compose.prod.yml ps
