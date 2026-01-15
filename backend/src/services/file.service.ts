import { injectable } from 'inversify';
import { execute } from '../db/connection.js';
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

@injectable()
export class FileService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async ensureRootFolder() {
     try {
       // Ensure upload directory exists
       try {
         await fs.access(this.uploadDir);
       } catch {
         await fs.mkdir(this.uploadDir, { recursive: true });
       }

       // Initialize default root folder "我的资源" if no folders exist
       const rows = await execute<any>(sql`SELECT * FROM files WHERE type = 'folder' AND parent_id IS NULL LIMIT 1`);
         
       if (rows.length === 0) {
         console.log('Initializing default root folder: 我的资源');
         await this.createFolder('我的资源', null);
       }
     } catch (err) {
       console.error('Failed to initialize default root folder:', err);
     }
  }

  async saveFile(file: File, originalName: string, mimeType: string, size: number, parentId: string | null = null): Promise<FileInfo> {
    const id = uuidv4();
    const ext = path.extname(originalName);
    const filename = `${id}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    await execute(sql`
      INSERT INTO files (id, filename, original_name, mime_type, size, type, parent_id) 
      VALUES (${id}, ${filename}, ${originalName}, ${mimeType}, ${size}, 'file', ${parentId})
    `);

    return {
      id,
      filename,
      originalName,
      mimeType,
      size,
      type: 'file',
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
    };
  }

  async listFiles(parentId: string | null = null, queryStr: string | null = null): Promise<FileInfo[]> {
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

    const files = await execute<any>(query);
    return files.map((f: any) => ({
      id: f.id,
      filename: f.filename,
      originalName: f.original_name,
      mimeType: f.mime_type,
      size: f.size,
      type: f.type || 'file',
      parentId: f.parent_id,
      createdAt: f.created_at,
    }));
  }

  async getRoots(): Promise<FileInfo[]> {
    const files = await execute<any>(sql`SELECT * FROM files WHERE type = 'folder' AND parent_id IS NULL ORDER BY created_at ASC`);

    return files.map((f: any) => ({
      id: f.id,
      filename: f.filename,
      originalName: f.original_name,
      mimeType: f.mime_type,
      size: f.size,
      type: f.type || 'file',
      parentId: f.parent_id,
      createdAt: f.created_at,
    }));
  }

  async createFolder(name: string, parentId: string | null = null): Promise<any> {
    const id = uuidv4();
    await execute(sql`
      INSERT INTO files (id, filename, original_name, type, parent_id) 
      VALUES (${id}, ${name}, ${name}, 'folder', ${parentId})
    `);
    return { id, name, type: 'folder', parentId };
  }

  async renameItem(id: string, newName: string): Promise<boolean> {
    await execute(sql`UPDATE files SET original_name = ${newName} WHERE id = ${id}`);
    return true;
  }

  async deleteFile(id: string): Promise<boolean> {
    const rows = await execute<any>(sql`SELECT * FROM files WHERE id = ${id}`);
    
    if (rows.length === 0) return false;

    const item = rows[0];

    if (item.type === 'folder') {
      // Find all items in this folder
      const children = await execute<any>(sql`SELECT id FROM files WHERE parent_id = ${id}`);
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

    await execute(sql`DELETE FROM files WHERE id = ${id}`);
    return true;
  }

  async getFileById(id: string): Promise<FileInfo | null> {
    const files = await execute<any>(sql`SELECT * FROM files WHERE id = ${id}`);
    
    if (files.length === 0) return null;

    const f = files[0];
    return {
      id: f.id,
      filename: f.filename,
      originalName: f.original_name,
      mimeType: f.mime_type,
      size: f.size,
      type: f.type || 'file',
      parentId: f.parent_id,
      createdAt: f.created_at,
    };
  }
}
