import { getDbPool } from '../db/connection.js';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface FileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export class FileService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async initTable() {
    const pool = getDbPool();
    const sql = `
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(36) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        size BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(sql);
    
    // Ensure upload directory exists
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: File, originalName: string, mimeType: string, size: number): Promise<FileInfo> {
    const id = uuidv4();
    const ext = path.extname(originalName);
    const filename = `${id}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const pool = getDbPool();
    await pool.query(
      'INSERT INTO files (id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?)',
      [id, filename, originalName, mimeType, size]
    );

    return {
      id,
      filename,
      originalName,
      mimeType,
      size,
      createdAt: new Date().toISOString(),
    };
  }

  async listFiles(): Promise<FileInfo[]> {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT * FROM files ORDER BY created_at DESC');
    const files = rows as any[];
    return files.map(f => ({
      id: f.id,
      filename: f.filename,
      originalName: f.original_name,
      mimeType: f.mime_type,
      size: f.size,
      createdAt: f.created_at,
    }));
  }

  async deleteFile(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT filename FROM files WHERE id = ?', [id]);
    const files = rows as any[];
    
    if (files.length === 0) return false;

    const filename = files[0].filename;
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Failed to delete file from disk: ${filePath}`, err);
    }

    await pool.query('DELETE FROM files WHERE id = ?', [id]);
    return true;
  }

  async getFileById(id: string): Promise<FileInfo | null> {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT * FROM files WHERE id = ?', [id]);
    const files = rows as any[];
    
    if (files.length === 0) return null;

    const f = files[0];
    return {
      id: f.id,
      filename: f.filename,
      originalName: f.original_name,
      mimeType: f.mime_type,
      size: f.size,
      createdAt: f.created_at,
    };
  }
}
