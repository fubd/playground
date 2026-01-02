import { Hono } from 'hono';
import { SystemService } from '../services/system.service.js';

const systemRouter = new Hono();
const systemService = new SystemService();

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

export default systemRouter;
