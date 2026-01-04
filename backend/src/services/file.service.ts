import { getDb } from '../db/connection.js';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string | null;
  size: number | null;
  type: 'file' | 'folder';
  parentId: string | null;
  createdAt: string;
}

export class FileService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async initTable() {
    const db = getDb();
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(36) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        size BIGINT,
        type ENUM('file', 'folder') DEFAULT 'file',
        parent_id VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_parent_id (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await db.execute(sql.raw(createTableSql));

    // Migration: Add columns if they don't exist (for existing databases)
    try {
      const [columns] = await db.execute(sql.raw('SHOW COLUMNS FROM files'));
      const columnNames = (columns as any[]).map(c => c.Field);

      if (!columnNames.includes('type')) {
        console.log('Adding "type" column to files table...');
        await db.execute(sql.raw('ALTER TABLE files ADD COLUMN type ENUM("file", "folder") DEFAULT "file" AFTER size'));
      }
      if (!columnNames.includes('parent_id')) {
        console.log('Adding "parent_id" column to files table...');
        await db.execute(sql.raw('ALTER TABLE files ADD COLUMN parent_id VARCHAR(36) NULL AFTER type'));
        await db.execute(sql.raw('ALTER TABLE files ADD INDEX idx_parent_id (parent_id)'));
      }
    } catch (err) {
      console.error('Database migration check failed:', err);
    }

    // Initialize default root folder "我的资源" if no folders exist
    try {
      const [rows] = await db.execute(sql`SELECT id FROM files WHERE type = 'folder' AND parent_id IS NULL LIMIT 1`);
      if ((rows as any[]).length === 0) {
        console.log('Initializing default root folder: 我的资源');
        await this.createFolder('我的资源', null);
      }
    } catch (err) {
      console.error('Failed to initialize default root folder:', err);
    }
    
    // Ensure upload directory exists
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: File, originalName: string, mimeType: string, size: number, parentId: string | null = null): Promise<FileInfo> {
    const id = uuidv4();
    const ext = path.extname(originalName);
    const filename = `${id}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const db = getDb();
    await db.execute(
      sql`INSERT INTO files (id, filename, original_name, mime_type, size, type, parent_id) VALUES (${id}, ${filename}, ${originalName}, ${mimeType}, ${size}, 'file', ${parentId})`
    );

    return {
      id,
      filename,
      originalName,
      mimeType,
      size,
      type: 'file',
      parentId,
      createdAt: new Date().toISOString(),
    };
  }

  async listFiles(parentId: string | null = null, queryStr: string | null = null): Promise<FileInfo[]> {
    const db = getDb();
    let query;

    if (queryStr) {
      // Global search
      const searchPattern = `%${queryStr}%`;
      query = sql`SELECT * FROM files WHERE original_name LIKE ${searchPattern} ORDER BY type DESC, created_at DESC`;
    } else if (parentId === null) {
      query = sql`SELECT * FROM files WHERE parent_id IS NULL ORDER BY type DESC, created_at DESC`;
    } else {
      query = sql`SELECT * FROM files WHERE parent_id = ${parentId} ORDER BY type DESC, created_at DESC`;
    }

    const [rows] = await db.execute(query);
    const files = rows as any[];
    return files.map(f => ({
      id: f.id,
      filename: f.filename,
      originalName: f.original_name,
      mimeType: f.mime_type,
      size: f.size,
      type: f.type,
      parentId: f.parent_id,
      createdAt: f.created_at,
    }));
  }

  async getRoots(): Promise<FileInfo[]> {
    const db = getDb();
    const [rows] = await db.execute(sql`SELECT * FROM files WHERE type = 'folder' AND parent_id IS NULL ORDER BY created_at ASC`);
    const files = rows as any[];
    return files.map(f => ({
      id: f.id,
      filename: f.filename,
      originalName: f.original_name,
      mimeType: f.mime_type,
      size: f.size,
      type: f.type,
      parentId: f.parent_id,
      createdAt: f.created_at,
    }));
  }

  async createFolder(name: string, parentId: string | null = null): Promise<any> {
    const id = uuidv4();
    const db = getDb();
    await db.execute(
      sql`INSERT INTO files (id, filename, original_name, type, parent_id) VALUES (${id}, ${name}, ${name}, 'folder', ${parentId})`
    );
    return { id, name, type: 'folder', parentId };
  }

  async renameItem(id: string, newName: string): Promise<boolean> {
    const db = getDb();
    await db.execute(sql`UPDATE files SET original_name = ${newName} WHERE id = ${id}`);
    return true;
  }

  async deleteFile(id: string): Promise<boolean> {
    const db = getDb();
    const [rows] = await db.execute(sql`SELECT * FROM files WHERE id = ${id}`);
    const items = rows as any[];
    
    if (items.length === 0) return false;

    const item = items[0];

    if (item.type === 'folder') {
      // Find all items in this folder
      const [childRows] = await db.execute(sql`SELECT id FROM files WHERE parent_id = ${id}`);
      const children = childRows as any[];
      for (const child of children) {
        await this.deleteFile(child.id);
      }
    } else {
      // It's a file, delete from disk
      const filePath = path.join(this.uploadDir, item.filename);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error(`Failed to delete file from disk: ${filePath}`, err);
      }
    }

    await db.execute(sql`DELETE FROM files WHERE id = ${id}`);
    return true;
  }

  async getFileById(id: string): Promise<FileInfo | null> {
    const db = getDb();
    const [rows] = await db.execute(sql`SELECT * FROM files WHERE id = ${id}`);
    const files = rows as any[];
    
    if (files.length === 0) return null;

    const f = files[0];
    return {
      id: f.id,
      filename: f.filename,
      originalName: f.original_name,
      mimeType: f.mime_type,
      size: f.size,
      type: f.type,
      parentId: f.parent_id,
      createdAt: f.created_at,
    };
  }
}
