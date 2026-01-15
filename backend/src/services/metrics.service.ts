import { injectable } from 'inversify';
import { execute } from '../db/connection.js';
import { sql } from 'drizzle-orm';

export interface Metric {
  id: number;
  cpu_load: number;
  memory_usage: number;
  created_at: Date;
}

@injectable()
export class MetricsService {
  
  async clearHistory() {
    try {
      await execute(sql`DELETE FROM system_metrics`);
      console.log('✓ Metrics table cleared');
    } catch (error) {
      console.error('Failed to clear metrics table:', error);
    }
  }

  async saveMetric(cpuLoad: number, memoryUsage: number) {
    try {
      await execute(sql`INSERT INTO system_metrics (cpu_load, memory_usage) VALUES (${cpuLoad}, ${memoryUsage})`);

      // Maintain only 48h data
      await execute(sql`DELETE FROM system_metrics WHERE created_at < NOW() - INTERVAL 48 HOUR`);

    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  }

  async getHistory(range: '1h' | '24h' = '1h'): Promise<Metric[]> {
    try {
      if (range === '24h') {
        const rows = await execute<any>(sql`
          SELECT 
            MIN(id) as id,
            AVG(cpu_load) as cpu_load,
            AVG(memory_usage) as memory_usage,
            MIN(created_at) as created_at
          FROM system_metrics
          WHERE created_at >= NOW() - INTERVAL 24 HOUR
          GROUP BY FLOOR(UNIX_TIMESTAMP(created_at) / 60)
          ORDER BY created_at ASC
        `);
        return rows.map((r: any) => ({
          id: r.id,
          cpu_load: parseFloat(r.cpu_load),
          memory_usage: parseFloat(r.memory_usage),
          created_at: new Date(r.created_at)
        }));
      }

      // Default 1h: Return raw data (10s interval)
      const rows = await execute<any>(sql`
          SELECT id, cpu_load, memory_usage, created_at
          FROM system_metrics
          WHERE created_at >= NOW() - INTERVAL 1 HOUR
          ORDER BY created_at ASC
      `);

      return rows.map((r: any) => ({
        id: r.id,
        cpu_load: r.cpu_load,
        memory_usage: r.memory_usage,
        created_at: r.created_at ? new Date(r.created_at) : new Date()
      }));

    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }
}
