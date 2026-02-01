import { Context } from 'hono';
import { inject, injectable } from 'inversify';
import { Controller, Post, Get } from '../framework/decorators.js';
import { TYPES } from '../types.js';
import { CrawlerService, BookQueryParams } from '../services/crawler.service.js';

@Controller('/api/crawler')
export class CrawlerController {
  constructor(
    @inject(TYPES.CrawlerService) private crawlerService: CrawlerService
  ) {}

  @Post('/discover')
  async discoverTags(c: Context) {
    try {
      await this.crawlerService.discoverCategories();
      return c.json({ status: 'success', message: 'Hierarchical discovery started' });
    } catch (error) {
      return c.json({ status: 'error', message: String(error) }, 500);
    }
  }

  @Get('/categories')
  async getCategories(c: Context) {
    try {
      const result = await this.crawlerService.getCategories();
      return c.json({ status: 'success', data: result });
    } catch (error) {
      return c.json({ status: 'error', message: String(error) }, 500);
    }
  }

  @Get('/books')
  async getBooks(c: Context) {
    try {
      const query = c.req.query();
      // Hono queries can return array for multi-params like tagCodes=A&tagCodes=B
      const allQueries = c.req.queries();
      const tagCodes = allQueries.tagCodes || [];
      
      const params: BookQueryParams = {
        page: query.page ? parseInt(query.page, 10) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 10,
        search: query.search || '',
        tagCodes: tagCodes,
        minRating: query.minRating ? parseFloat(query.minRating) : undefined,
        maxRating: query.maxRating ? parseFloat(query.maxRating) : undefined,
        sortBy: (query.sortBy as any) || 'created_at',
        sortOrder: (query.sortOrder as any) || 'desc',
      };

      const result = await this.crawlerService.getBooks(params);
      
      return c.json({
        status: 'success',
        data: result.books,
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          total: result.total,
          totalPages: Math.ceil(result.total / (params.pageSize || 10))
        }
      });
    } catch (error) {
      console.error('Get books failed:', error);
      return c.json({ status: 'error', message: String(error) }, 500);
    }
  }

  @Get('/books/:id')
  async getBookById(c: Context) {
    try {
      const id = c.req.param('id');
      
      if (!id) {
        return c.json({ status: 'error', message: 'Invalid book ID' }, 400);
      }

      const book = await this.crawlerService.getBookById(id);
      
      if (!book) {
        return c.json({ status: 'error', message: 'Book not found' }, 404);
      }

      return c.json({
        status: 'success',
        data: book
      });
    } catch (error) {
      console.error('Get book failed:', error);
      return c.json({ status: 'error', message: String(error) }, 500);
    }
  }

  @Get('/image-proxy')
  async imageProxy(c: Context) {
    const url = c.req.query('url');
    if (!url) {
      return c.text('Missing URL', 400);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://book.douban.com/',
        }
      });

      if (!response.ok) {
        return c.text('Failed to fetch image', response.status as any);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      
      c.header('Content-Type', contentType);
      c.header('Cache-Control', 'public, max-age=86400');
      
      return c.body(arrayBuffer);
    } catch (error) {
      console.error('Image proxy failed:', error);
      return c.text('Internal Server Error', 500);
    }
  }
}
