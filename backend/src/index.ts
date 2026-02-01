import 'reflect-metadata';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import dotenv from 'dotenv';
import { container } from './container.js';
import { TYPES } from './types.js';
import { testDbConnection, initDatabase } from './db/connection.js';
import { MetricsService } from './services/metrics.service.js';
import { SystemService } from './services/system.service.js';
import { FileService } from './services/file.service.js';
import { CrawlerService } from './services/crawler.service.js';
import { Scheduler } from './framework/scheduler.js';

// Framework & Controllers
import { registerControllers } from './framework/registrar.js';
import { MockController } from './controllers/mock.controller.js';
import { TodoController } from './controllers/todo.controller.js';
import { MetricsController } from './controllers/metrics.controller.js';
import { SystemController } from './controllers/system.controller.js';
import { FileController } from './controllers/file.controller.js';
import { CrawlerController } from './controllers/crawler.controller.js';

dotenv.config();

const app = new Hono();

// Debug Env
console.log('--- Backend Service v2.3 (Decorator Routing) Starting ---');
console.log('Environment Keys:', Object.keys(process.env).sort());
console.log('FS_PREFIX value:', process.env.FS_PREFIX);

// 中间件
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// 静态文件服务 (uploads)
app.use('/uploads/*', serveStatic({ root: './' }));

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 自动注册控制器路由
registerControllers(
  app,
  [
    SystemController,
    TodoController,
    FileController,
    MetricsController,
    MetricsController,
    MockController,
    CrawlerController,
  ],
  container
);

// 404 处理
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

const port = parseInt(process.env.PORT || '3001');

// 启动服务器
console.log('🚀 Starting server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${port}`);

// 初始化数据库连接
testDbConnection().then(async (connected) => {
  if (connected) {
    console.log('✓ Database is connected');
    
    // 运行迁移
    await initDatabase();

    // 解决 Service 依赖
    const systemService = container.get<SystemService>(TYPES.SystemService);
    const metricsService = container.get<MetricsService>(TYPES.MetricsService);
    const fileService = container.get<FileService>(TYPES.FileService);
    const crawlerService = container.get<CrawlerService>(TYPES.CrawlerService);
    
    // 初始化一些基础数据
    // await metricsService.clearHistory(); // Disable to preserve data across restarts
    await fileService.ensureRootFolder();

    console.log('✓ Services initialized');

    // 启动定时任务调度器 (Refactored to use node-cron)
    const scheduler = container.get<Scheduler>(TYPES.Scheduler);
    scheduler.start();

  } else {
    console.log('⚠️  Database is not available (will continue without it)');
  }
});

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});

console.log(`✓ Server is running on http://0.0.0.0:${port}`);
console.log(`✓ API endpoint: http://0.0.0.0:${port}/api`);
console.log(`✓ Health check: http://0.0.0.0:${port}/health`);
