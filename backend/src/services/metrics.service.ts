import { getDb } from '../db/connection.js';
import { sql } from 'drizzle-orm';

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
      await db.execute(
        sql`INSERT INTO ${sql.raw(this.tableName)} (cpu_load, memory_usage) VALUES (${cpuLoad}, ${memoryUsage})`
      );
    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  }

  async getHistory(limitMinutes = 60): Promise<Metric[]> {
    const db = getDb();
    try {
      const [rows] = await db.execute(
        sql`SELECT * FROM ${sql.raw(this.tableName)} 
         WHERE created_at >= NOW() - INTERVAL ${limitMinutes} MINUTE 
         ORDER BY created_at ASC`
      );
      return rows as Metric[];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }
}
