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

  async initTable() {
    const db = getDb();
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
    try {
      await db.insert(metrics).values({
        cpuLoad,
        memoryUsage
      });
    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  }

  async getHistory(limitMinutes = 60): Promise<Metric[]> {
    const db = getDb();
    try {
      const results = await db
        .select()
        .from(metrics)
        .where(
          sql`${metrics.createdAt} >= NOW() - INTERVAL ${limitMinutes} MINUTE`
        )
        .orderBy(asc(metrics.createdAt));

      // Map back to the expected Metric interface (frontend expects snake_case)
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
