import { getDbPool } from '../db/connection.js';
import { RowDataPacket } from 'mysql2';

export interface Metric {
  id: number;
  cpu_load: number;
  memory_usage: number;
  created_at: Date;
}

export class MetricsService {
  private tableName = 'system_metrics';

  async initTable() {
    const pool = getDbPool();
    if (!pool) return;

    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          cpu_load FLOAT NOT NULL,
          memory_usage FLOAT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created_at (created_at)
        )
      `);
      console.log(`✓ Table ${this.tableName} initialized`);
    } catch (error) {
      console.error(`✗ Failed to initialize table ${this.tableName}:`, error);
    }
  }

  async saveMetric(cpuLoad: number, memoryUsage: number) {
    const pool = getDbPool();
    if (!pool) return;

    try {
      await pool.execute(
        `INSERT INTO ${this.tableName} (cpu_load, memory_usage) VALUES (?, ?)`,
        [cpuLoad, memoryUsage]
      );
    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  }

  async getHistory(limitMinutes = 60): Promise<Metric[]> {
    const pool = getDbPool();
    if (!pool) return [];

    try {
      const [rows] = await pool.execute<RowDataPacket[] & Metric[]>(
        `SELECT * FROM ${this.tableName} 
         WHERE created_at >= NOW() - INTERVAL ? MINUTE 
         ORDER BY created_at ASC`,
        [limitMinutes]
      );
      return rows;
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }
}
