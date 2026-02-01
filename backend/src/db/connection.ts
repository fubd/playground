import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { SQL } from 'drizzle-orm';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'server_monitor',
};

let pool: mysql.Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

import { migrate } from 'drizzle-orm/mysql2/migrator';

export const getDbPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
      charset: 'utf8mb4',
    });
  }
  return pool;
};

export const getDb = () => {
  if (!db) {
    const connectionPool = getDbPool();
    db = drizzle(connectionPool, { schema, mode: 'default' }) as any;
  }
  return db!;
};

export const initDatabase = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const db = getDb();
      console.log(`📦 Running database migrations (attempt ${i + 1}/${retries})...`);
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('✓ Database migrations completed');
      return true;
    } catch (error) {
      console.error(`✗ Database migration attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        console.log(`Waiting ${delay / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

export const testDbConnection = async (): Promise<boolean> => {
  try {
    const connection = await getDbPool().getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
};

// 增强的执行助手，带重试逻辑
export const execute = async <T = any>(query: SQL, retryCount = 0): Promise<any> => {
  try {
    const db = getDb();
    const [rows] = await db.execute(query);
    return rows;
  } catch (error: any) {
    if ((error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET') && retryCount < 3) {
      console.warn(`[DB] Connection lost, retrying (${retryCount + 1})...`);
      // 强制销毁旧 pool 并新建
      pool = null;
      db = null;
      return execute(query, retryCount + 1);
    }
    throw error;
  }
};
