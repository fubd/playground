import { getDb } from '../db/connection.js';
import { sql } from 'drizzle-orm';

export class MockService {
  private tableName = 'mock';

  async initTable() {
    const db = getDb();
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL
        )
      `));
      console.log(`✓ Table ${this.tableName} initialized`);
    } catch (error) {
      console.error(`✗ Failed to initialize table ${this.tableName}:`, error);
    }
  }

  async add(data: {title: string}) {
    const db = getDb();
    try {
      const [result] = await db.execute(sql`INSERT INTO mock (title) VALUES (${data.title})`);
      const insertId = (result as any).insertId;
      const [rows] = await db.execute(sql`SELECT * FROM mock WHERE id = ${insertId}`);
      console.log('>>>>>>>', rows);
      return null;
    } catch (error) {
      console.error('Failed to create todo:', error);
      return null;
    }
  }
}
