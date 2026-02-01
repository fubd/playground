import cron from 'node-cron';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types.js';
import { MetricsService } from '../services/metrics.service.js';
import { SystemService } from '../services/system.service.js';
import { CrawlerService } from '../services/crawler.service.js';

@injectable()
export class Scheduler {
  constructor(
    @inject(TYPES.MetricsService) private metricsService: MetricsService,
    @inject(TYPES.SystemService) private systemService: SystemService,
    @inject(TYPES.CrawlerService) private crawlerService: CrawlerService
  ) {}

  start() {
    console.log('⏰ Starting Scheduler (node-cron)...');

    // System Metrics Collection: Every 10 seconds
    cron.schedule('*/10 * * * * *', async () => {
      try {
        const info = await this.systemService.getSystemInfo();
        await this.metricsService.saveMetric(
          info.currentLoad.currentLoad,
          info.memory.usedPercent
        );
        // console.log('✓ Metrics collected'); // verbose
      } catch (e) {
        console.error('Error collecting metrics:', e);
      }
    });
    console.log('✓ Metrics job scheduled (*/10 * * * * *)');

    // Crawler Job: Every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      try {
        console.log('[Scheduler] Starting scheduled crawl...');
        const result = await this.crawlerService.scheduledCrawl();
        console.log(`[Scheduler] Crawl completed: ${result.count} books from tag "${result.tag}"`);
      } catch (e) {
        console.error('[Scheduler] Scheduled crawl failed:', e);
      }
    }); 
    console.log('✓ Crawler job scheduled (*/2 * * * *)');
  }
}
