import { getDb } from '../db/connection.js';
import { sql } from 'drizzle-orm';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: Date;
}

export class TodoService {
  private tableName = 'todos';

  async initTable() {
    const db = getDb();
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `));
      console.log(`✓ Table ${this.tableName} initialized`);
    } catch (error) {
      console.error(`✗ Failed to initialize table ${this.tableName}:`, error);
    }
  }

  async getAll(): Promise<Todo[]> {
    const db = getDb();
    try {
      const [rows] = await db.execute(sql`SELECT * FROM todos ORDER BY created_at DESC`);
      return (rows as any[]).map(row => ({
        id: row.id,
        title: row.title,
        completed: Boolean(row.completed),
        created_at: row.created_at
      })) as Todo[];
    } catch (error) {
      console.error('Failed to get todos:', error);
      return [];
    }
  }

  async create(title: string): Promise<Todo | null> {
    const db = getDb();
    try {
      const [result] = await db.execute(sql`INSERT INTO todos (title) VALUES (${title})`);
      const insertId = (result as any).insertId;
      const [rows] = await db.execute(sql`SELECT * FROM todos WHERE id = ${insertId}`);
      const row = (rows as any[])[0];
      if (row) {
        return { ...row, completed: Boolean(row.completed) };
      }
      return null;
    } catch (error) {
      console.error('Failed to create todo:', error);
      return null;
    }
  }

  async update(id: number, data: { title?: string; completed?: boolean }): Promise<boolean> {
    const db = getDb();
    const updates: any[] = [];
    
    if (data.title !== undefined) {
      updates.push(sql`title = ${data.title}`);
    }
    if (data.completed !== undefined) {
      updates.push(sql`completed = ${data.completed}`);
    }

    if (updates.length === 0) return false;

    try {
      // Drizzle handles joining sql chunks with commas automatically when using sql.join
      const setClause = sql.join(updates, sql.raw(', '));
      await db.execute(sql`UPDATE todos SET ${setClause} WHERE id = ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to update todo:', error);
      return false;
    }
  }

  async delete(id: number): Promise<boolean> {
    const db = getDb();
    try {
      await db.execute(sql`DELETE FROM todos WHERE id = ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      return false;
    }
  }
}
