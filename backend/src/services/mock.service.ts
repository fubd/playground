import { injectable } from 'inversify';
import { execute } from '../db/connection.js';
import { sql } from 'drizzle-orm';

@injectable()
export class MockService {
  async add(data: {title: string}) {
    try {
      const result = await execute<any>(sql`INSERT INTO mock (title) VALUES (${data.title})`);
      const insertId = result.insertId;
      const rows = await execute<any>(sql`SELECT * FROM mock WHERE id = ${insertId}`);
      console.log('>>>>>>>', rows);
      return null;
    } catch (error) {
      console.error('Failed to create mock:', error);
      return null;
    }
  }
}
