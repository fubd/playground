import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import dotenv from 'dotenv';
import systemRouter from './routes/system.routes.js';
import todoRouter from './routes/todo.routes.js';
import fileRouter from './routes/file.routes.js';
import { testDbConnection } from './db/connection.js';
import { SystemService } from './services/system.service.js';
import { MetricsService } from './services/metrics.service.js';
import { TodoService } from './services/todo.service.js';
import { FileService } from './services/file.service.js';

dotenv.config();

const app = new Hono();

// Debug Env
console.log('--- Backend Service v2.2 (Auto-Detect Host) Starting ---');
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

// API 路由
app.route('/api', systemRouter);
app.route('/api/todos', todoRouter);
app.route('/api/files', fileRouter);

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

// 测试数据库连接（可选）
// ... imports

// 测试数据库连接（可选）
testDbConnection().then(async (connected) => {
  if (connected) {
    console.log('✓ Database is ready');
    
    // 初始化指标服务
    const systemService = new SystemService();
    const metricsService = new MetricsService();
    const todoService = new TodoService();
    const fileService = new FileService();
    
    await metricsService.initTable();
    await metricsService.clearHistory();
    await todoService.initTable();
    await fileService.initTable();
    console.log('✓ Tables checked/initialized');

    // 启动 10s 定时采集
    setInterval(async () => {
      try {
        const info = await systemService.getSystemInfo();
        await metricsService.saveMetric(
          info.currentLoad.currentLoad,
          info.memory.usedPercent
        );
      } catch (e) {
        console.error('Error collecting metrics:', e);
      }
    }, 10000);
    console.log('✓ Metrics collection started (10s interval)');

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
