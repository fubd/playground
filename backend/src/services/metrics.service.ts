import { getDb } from '../db/connection.js';
import { sql, gt, asc } from 'drizzle-orm';
import { metrics } from '../db/schema.js';

export interface Metric {
  id: number;
  cpu_load: number;
  memory_usage: number;
  created_at: Date;
}

export class MetricsService {
  private tableName = 'system_metrics';

  async clearHistory() {
    const db = getDb();
    if (!db) return;
    try {
      await db.execute(sql`TRUNCATE TABLE ${sql.raw(this.tableName)}`);
      console.log('✓ Metrics table cleared');
    } catch (error) {
      console.error('Failed to clear metrics table:', error);
    }
  }

  async initTable() {
    const db = getDb();
    if (!db) return;
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          cpu_load FLOAT NOT NULL,
          memory_usage FLOAT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created_at (created_at)
        )
      `));
      console.log(`✓ Table ${this.tableName} initialized`);
    } catch (error) {
      console.error(`✗ Failed to initialize table ${this.tableName}:`, error);
    }
  }

  async saveMetric(cpuLoad: number, memoryUsage: number) {
    const db = getDb();
    if (!db) return;
    try {
      await db.insert(metrics).values({
        cpuLoad,
        memoryUsage
      });

      // Maintain only 48h data
      await db.execute(
        sql`DELETE FROM ${sql.raw(this.tableName)} WHERE created_at < NOW() - INTERVAL 48 HOUR`
      );
    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  }

  async getHistory(range: '1h' | '24h' = '1h'): Promise<Metric[]> {
    const db = getDb();
    if (!db) return [];
    try {
      if (range === '24h') {
        // Return 1-minute averages for the last 24 hours
        const [rows] = await db.execute(sql`
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
        return (rows as unknown as any[]).map(r => ({
          id: r.id,
          cpu_load: parseFloat(r.cpu_load),
          memory_usage: parseFloat(r.memory_usage),
          created_at: new Date(r.created_at)
        }));
      }

      // Default 1h: Return raw data (10s interval)
      const results = await db
        .select()
        .from(metrics)
        .where(
          sql`${metrics.createdAt} >= NOW() - INTERVAL 1 HOUR`
        )
        .orderBy(asc(metrics.createdAt));

      return results.map(r => ({
        id: r.id,
        cpu_load: r.cpuLoad,
        memory_usage: r.memoryUsage,
        created_at: r.createdAt as Date
      }));
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }
}
