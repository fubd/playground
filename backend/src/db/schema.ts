import { mysqlTable, varchar, bigint, timestamp, mysqlEnum, int, boolean as drizzleBoolean, float, text, decimal } from 'drizzle-orm/mysql-core';

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
  cpuLoad: float('cpu_load').notNull(),
  memoryUsage: float('memory_usage').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const alerts = mysqlTable('alerts', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  alertLevel: mysqlEnum('alert_level', ['info', 'warning', 'critical']).notNull(),
  message: text('message').notNull(),
  thresholdValue: decimal('threshold_value', { precision: 5, scale: 2 }),
  actualValue: decimal('actual_value', { precision: 5, scale: 2 }),
  resolved: drizzleBoolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const configurations = mysqlTable('configurations', {
  id: int('id').primaryKey().autoincrement(),
  configKey: varchar('config_key', { length: 100 }).notNull().unique(),
  configValue: text('config_value').notNull(),
  description: varchar('description', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const mock = mysqlTable('mock', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
});

export const books = mysqlTable('books', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  url: text('url').notNull(),
  urlHash: varchar('url_hash', { length: 32 }).notNull().unique(),
  author: varchar('author', { length: 255 }),
  publisher: varchar('publisher', { length: 255 }),
  publishDate: varchar('publish_date', { length: 50 }),
  price: int('price'),
  rating: float('rating'),
  coverImage: text('cover_image'),
  summary: text('summary'),
  tagCode: varchar('tag_code', { length: 100 }), // This will store the leaf category code
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = mysqlTable('categories', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  parentId: bigint('parent_id', { mode: 'number' }),
  level: int('level').default(1),
  status: mysqlEnum('status', ['pending', 'processing', 'done', 'failed']).default('pending'),
  priority: int('priority').default(0),
  bookCount: int('book_count').default(0),
  lastStart: int('last_start').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
