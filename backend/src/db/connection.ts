import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
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

export const initDatabase = async () => {
  try {
    const db = getDb();
    console.log('📦 Running database migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✓ Database migrations completed');
    return true;
  } catch (error) {
    console.error('✗ Database migration failed:', error);
    return false;
  }
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

import { SQL } from 'drizzle-orm';

export const execute = async <T = any>(query: SQL): Promise<any> => {
  const db = getDb();
  const [rows] = await db.execute(query);
  return rows;
};
