
import { inject } from 'inversify';
import { TYPES } from '../types.js';
import { MetricsService } from '../services/metrics.service.js';
import { Context } from 'hono';
import { Controller, Get } from '../framework/decorators.js';

@Controller('/api/metrics')
export class MetricsController {
  constructor(@inject(TYPES.MetricsService) private metricsService: MetricsService) {}

  @Get('/status')
  public async getStatus(c: Context) {
    return c.json({ status: 'ok', uptime: process.uptime() });
  }

  @Get('/history')
  public async getHistory(c: Context) {
     const range = c.req.query('range') as '1h' | '24h' || '1h';
     const data = await this.metricsService.getHistory(range);
     return c.json(data);
  }
}
