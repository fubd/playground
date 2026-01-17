
import { inject } from 'inversify';
import { TYPES } from '../types.js';
import { FileService } from '../services/file.service.js';
import { Context } from 'hono';
import fs from 'fs/promises';
import path from 'path';
import { Controller, Get, Post, Put, Delete } from '../framework/decorators.js';

@Controller('/api/files')
export class FileController {
  constructor(@inject(TYPES.FileService) private fileService: FileService) {
    this.fileService.ensureRootFolder();
  }

  @Post('/upload')
  public async upload(c: Context) {
    try {
      const body = await c.req.parseBody();
      const file = body['file'];
      const parentIdRaw = body['parentId'];
      const parentId = (parentIdRaw === 'null' || !parentIdRaw) ? null : parentIdRaw as string;

      console.log('📤 Upload Request:', {
        fileName: file instanceof File ? file.name : 'Not a file',
        parentIdRaw,
        parentIdProcessed: parentId
      });

      if (!file || !(file instanceof File)) {
         console.warn('⚠️ Upload failed: No file or invalid file instance');
         return c.json({ error: 'No file uploaded' }, 400);
      }

      const fileInfo = await this.fileService.saveFile(
        file,
        file.name,
        file.type,
        file.size,
        parentId
      );
      return c.json(fileInfo);
    } catch (err) {
      console.error('Upload error:', err);
      return c.json({ error: err instanceof Error ? err.message : 'Upload failed' }, 500);
    }
  }

  @Get('/')
  public async listFiles(c: Context) {
    const qParentId = c.req.query('parentId');
    const parentId = (qParentId === 'null' || !qParentId) ? null : qParentId;
    const query = c.req.query('q') || null;

    console.log('🔍 ListFiles Request:', { qParentId, parentIdProcessed: parentId, query });

    const files = await this.fileService.listFiles(parentId, query);
    console.log(`✅ Found ${files.length} files`);
    return c.json(files);
  }

  @Get('/roots')
  public async getRoots(c: Context) {
    const files = await this.fileService.getRoots();
    return c.json(files);
  }

  @Post('/folder')
  public async createFolder(c: Context) {
    const { name, parentId } = await c.req.json();
    if (!name) return c.json({ error: 'Name is required' }, 400);
    const folder = await this.fileService.createFolder(name, parentId || null);
    return c.json(folder);
  }

  @Put('/:id/rename')
  public async rename(c: Context) {
    const id = c.req.param('id');
    const { name } = await c.req.json();
    if (!id || !name) return c.json({ error: 'Params missing' }, 400);
    const success = await this.fileService.renameItem(id, name);
    return c.json({ success });
  }

  @Delete('/delete')
  public async delete(c: Context) {
    const id = c.req.query('id');
    if (!id) return c.json({ error: 'ID missing' }, 400);
    const success = await this.fileService.deleteFile(id);
    return c.json({ success });
  }

  @Get('/:id/content')
  public async serveFile(c: Context) {
    const id = c.req.param('id');
    const fileInfo = await this.fileService.getFileById(id);
    
    if (!fileInfo) {
      return c.notFound();
    }
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, fileInfo.filename);
    
    try {
        const content = await fs.readFile(filePath);
        return c.body(content, 200, {
            'Content-Type': fileInfo.mimeType || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${encodeURIComponent(fileInfo.originalName)}"`
        });
    } catch (e) {
        return c.notFound();
    }
  }
}
