import { injectable, inject } from 'inversify';
import { TYPES } from '../types.js';
import { execute } from '../db/connection.js';
import { sql } from 'drizzle-orm';


export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: Date;
}

@injectable()
export class TodoService {
  
  async getAll(): Promise<Todo[]> {
    try {
      // Changed to use helper
      const rows = await execute<any>(sql`SELECT * FROM todos ORDER BY created_at DESC`);
      return rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        completed: Boolean(row.completed),
        created_at: row.created_at
      }));
    } catch (error) {
      console.error('Failed to get todos:', error);
      return [];
    }
  }

  async create(title: string): Promise<Todo | null> {
    try {
      // Changed to use helper
      const result = await execute<any>(sql`INSERT INTO todos (title, completed) VALUES (${title}, FALSE)`);
      const insertId = result.insertId;
      
      const rows = await execute<any>(sql`SELECT * FROM todos WHERE id = ${insertId} LIMIT 1`);
      
      const newTodo = rows[0];
      if (newTodo) {
         return {
            id: newTodo.id,
            title: newTodo.title,
            completed: Boolean(newTodo.completed),
            created_at: newTodo.created_at
         };
      }
      return null;
    } catch (error) {
      console.error('Failed to create todo:', error);
      return null;
    }
  }

  async update(id: number, data: { title?: string; completed?: boolean }): Promise<boolean> {
    try {
      const updates: any[] = [];
      if (data.title !== undefined) updates.push(sql`title = ${data.title}`);
      if (data.completed !== undefined) updates.push(sql`completed = ${data.completed}`);
      
      if (updates.length === 0) return false;

      const setClause = sql.join(updates, sql.raw(', '));
      // Changed to use helper
      await execute(sql`UPDATE todos SET ${setClause} WHERE id = ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to update todo:', error);
      return false;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      // Changed to use helper
      await execute(sql`DELETE FROM todos WHERE id = ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      return false;
    }
  }
}
