import { getDbPool } from '../db/connection.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: Date;
}

export class TodoService {
  private tableName = 'todos';

  async initTable() {
    const pool = getDbPool();
    if (!pool) return;

    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log(`✓ Table ${this.tableName} initialized`);
    } catch (error) {
      console.error(`✗ Failed to initialize table ${this.tableName}:`, error);
    }
  }

  async getAll(): Promise<Todo[]> {
    const pool = getDbPool();
    if (!pool) return [];

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
      );
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
    const pool = getDbPool();
    if (!pool) return null;

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO ${this.tableName} (title) VALUES (?)`,
        [title]
      );
      const [rows] = await pool.execute<RowDataPacket[] & Todo[]>(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [result.insertId]
      );
      if (rows[0]) {
        return { ...rows[0], completed: Boolean(rows[0].completed) };
      }
      return null;
    } catch (error) {
      console.error('Failed to create todo:', error);
      return null;
    }
  }

  async update(id: number, data: { title?: string; completed?: boolean }): Promise<boolean> {
    const pool = getDbPool();
    if (!pool) return false;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      values.push(data.completed);
    }

    if (updates.length === 0) return false;

    values.push(id);

    try {
      await pool.execute(
        `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      return true;
    } catch (error) {
      console.error('Failed to update todo:', error);
      return false;
    }
  }

  async delete(id: number): Promise<boolean> {
    const pool = getDbPool();
    if (!pool) return false;

    try {
      await pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      return false;
    }
  }
}
