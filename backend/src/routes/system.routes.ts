import { Hono } from 'hono';
import { SystemService } from '../services/system.service.js';
import { MetricsService } from '../services/metrics.service.js';

const systemRouter = new Hono();
const systemService = new SystemService();
const metricsService = new MetricsService();

systemRouter.get('/system-info', async (c) => {
  try {
    const systemInfo = await systemService.getSystemInfo();
    return c.json(systemInfo);
  } catch (error) {
    console.error('Error in /system-info:', error);
    return c.json(
      {
        error: 'Failed to fetch system information',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

systemRouter.get('/metrics/history', async (c) => {
  try {
    const range = c.req.query('range') as '1h' | '24h' || '1h';
    const history = await metricsService.getHistory(range);
    return c.json(history);
  } catch (error) {
    console.error('Error in /metrics/history:', error);
    return c.json({ error: 'Failed to fetch metrics history' }, 500);
  }
});

export default systemRouter;
