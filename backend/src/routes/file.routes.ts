import { Hono } from 'hono';
import { FileService } from '../services/file.service.js';

const fileRoutes = new Hono();
const fileService = new FileService();

// List all files
fileRoutes.get('/', async (c) => {
  try {
    const files = await fileService.listFiles();
    return c.json(files);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Upload a file
fileRoutes.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const savedFile = await fileService.saveFile(
      file,
      file.name,
      file.type,
      file.size
    );

    return c.json(savedFile);
  } catch (err: any) {
    console.error('Upload error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// Delete a file
fileRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const success = await fileService.deleteFile(id);
    if (success) {
      return c.json({ message: 'File deleted' });
    } else {
      return c.json({ error: 'File not found' }, 404);
    }
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Download a file
fileRoutes.get('/download/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const fileInfo = await fileService.getFileById(id);

    if (!fileInfo) {
      return c.json({ error: 'File not found' }, 404);
    }

    // For download, we could either redirect or serve the file here.
    // However, the user wants to "复制资源链接", so we might need a way to serve it directly.
    // I'll implement a simple redirect to a public path if Nginx handles it, 
    // or just serve it from here. Since Nginx will handle /uploads/, 
    // maybe we just return the URL? 
    // Let's implement direct serving here as well for flexibility.
    
    return c.json({ url: `/uploads/${fileInfo.filename}` });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default fileRoutes;
export { fileService };
