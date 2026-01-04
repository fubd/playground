import { mysqlTable, varchar, bigint, timestamp, mysqlEnum, int, boolean as drizzleBoolean, text } from 'drizzle-orm/mysql-core';

export const files = mysqlTable('files', {
  id: varchar('id', { length: 36 }).primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: bigint('size', { mode: 'number' }),
  type: mysqlEnum('type', ['file', 'folder']).default('file'),
  parentId: varchar('parent_id', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const todos = mysqlTable('todos', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  completed: drizzleBoolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const metrics = mysqlTable('system_metrics', {
  id: int('id').primaryKey().autoincrement(),
  cpuLoad: text('cpu_load').notNull(), // text or float, MetricsService uses FLOAT in initTable
  memoryUsage: text('memory_usage').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
