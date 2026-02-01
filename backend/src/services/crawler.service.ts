import { injectable } from 'inversify';
import { execute } from '../db/connection.js';
import { sql } from 'drizzle-orm';
import * as cheerio from 'cheerio';

// User-Agent 轮换池
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export interface BookQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tagCodes?: string[]; 
  minRating?: number;
  maxRating?: number;
  sortBy?: 'rating' | 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface Book {
  id: string; // Changed to string for BigInt compatibility
  title: string;
  url: string;
  tagCode: string;
  author: string;
  publisher: string;
  publishDate: string;
  price: number;
  rating: number;
  coverImage: string;
  summary: string;
  createdAt: string;
}

export interface CategoryNode {
  id: string; // Changed to string for BigInt compatibility
  name: string;
  code: string;
  level: number;
  bookCount: number;
  children?: CategoryNode[];
}

@injectable()
export class CrawlerService {
  
  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  // 发现并初始化带有层级的全部分类
  async discoverCategories(): Promise<void> {
    try {
      console.log('[Crawler] Discovering hierarchical categories from Douban...');
      const url = 'https://book.douban.com/tag/';
      const response = await fetch(url, {
        headers: { 'User-Agent': this.getRandomUserAgent() }
      });

      if (!response.ok) {
        console.error(`[Crawler] Failed to fetch category directory: ${response.status}`);
        return;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      let priority = 0;

      // 遍历一级和二级分类
      const wrappers = $('.tag-title-wrapper').toArray();
      for (let i = 0; i < wrappers.length; i++) {
        const wrapper = wrappers[i];
        const $wrapper = $(wrapper);
        const level1Name = $wrapper.text().trim().replace(/·/g, '');
        if (!level1Name) continue;

        console.log(`[Crawler] Processing Level 1 Category: ${level1Name}`);
        const level1Code = `cat_${encodeURIComponent(level1Name).replace(/%/g, '').toLowerCase().slice(0, 40)}`;

        // 插入一级分类
        const parentId = await this.insertCategory(level1Name, level1Code, null, 1);
        if (!parentId) continue;

        // 寻找紧跟在 wrapper 后的 tagCol
        const $tagCol = $wrapper.next('.tagCol');
        const tags = $tagCol.find('td a').toArray();
        for (const tag of tags) {
          const l2Name = $(tag).text().trim();
          if (!l2Name) continue;

          const l2Code = encodeURIComponent(l2Name).replace(/%/g, '').toLowerCase().slice(0, 40) + '_' + (priority++);
          console.log(`[Crawler]   Found Level 2 Tag: ${l2Name}`);
          await this.insertCategory(l2Name, l2Code, parentId, 2);
        }
      }
      
      console.log('[Crawler] Hierarchical categories initialization finished');
    } catch (e) {
      console.error('[Crawler] Failed during discoverCategories:', e);
    }
  }

  private async insertCategory(name: string, code: string, parentId: string | null, level: number): Promise<string | null> {
    try {
      await execute(sql`
        INSERT INTO categories (name, code, parent_id, level, priority, status) 
        VALUES (${name}, ${code}, ${parentId}, ${level}, 0, ${level === 1 ? 'done' : 'pending'})
        ON DUPLICATE KEY UPDATE 
          parent_id = VALUES(parent_id),
          level = VALUES(level)
      `);
      const result = await execute(sql`SELECT id FROM categories WHERE code = ${code} LIMIT 1`);
      return result[0]?.id ? String(result[0].id) : null;
    } catch (e) {
      console.error(`[Crawler] Failed to insert/find category ${name}:`, e);
      return null;
    }
  }

  // 获取树形结构的分类列表
  async getCategories(): Promise<CategoryNode[]> {
    try {
      const allCates = await execute(sql`SELECT id, name, code, parent_id as parentId, level, book_count as bookCount FROM categories ORDER BY priority ASC`);
      
      const nodeMap: Record<string, CategoryNode> = {};
      const tree: CategoryNode[] = [];

      allCates.forEach((item: any) => {
        const idStr = String(item.id);
        const parentIdStr = item.parentId ? String(item.parentId) : null;
        const node: CategoryNode = { 
          id: idStr,
          name: item.name,
          code: item.code,
          level: item.level,
          bookCount: item.bookCount,
          children: [] 
        };
        nodeMap[idStr] = node;
        if (parentIdStr === null) {
          tree.push(node);
        } else {
          const parent = nodeMap[parentIdStr];
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          }
        }
      });

      return tree;
    } catch (e) {
      console.error('[Crawler] Failed to get categories:', e);
      return [];
    }
  }

  // 获取下一个需要抓取的叶子节点
  private async getNextLeafToProcess(): Promise<any | null> {
    try {
      const result = await execute(sql`
        SELECT id, name, code, level, status, priority, book_count, last_start, parent_id as parentId FROM categories 
        WHERE level = 2 AND status IN ('pending', 'processing') 
        ORDER BY status DESC, priority ASC 
        LIMIT 1
      `);
      return result[0] || null;
    } catch (e) {
      console.error('[Crawler] Failed to get next leaf:', e);
      return null;
    }
  }

  // 更新分类状态
  private async updateCateProgress(id: string, update: { status?: string; bookCount?: number; lastStart?: number }): Promise<void> {
    try {
      const sets = [];
      if (update.status) sets.push(sql`status = ${update.status}`);
      if (update.bookCount !== undefined) sets.push(sql`book_count = ${update.bookCount}`);
      if (update.lastStart !== undefined) sets.push(sql`last_start = ${update.lastStart}`);
      
      if (sets.length === 0) return;
      const setClause = sql.join(sets, sql`, `);
      await execute(sql`UPDATE categories SET ${setClause} WHERE id = ${id}`);
    } catch (e) {
      console.error('[Crawler] Failed to update category progress:', e);
    }
  }

  async crawlDoubanBooks(cateRecord: any): Promise<{ count: number; message: string; errors?: string[] }> {
    let totalCrawled = cateRecord.book_count || 0;
    let start = cateRecord.last_start || 0;
    const batchSize = 20;
    const saveErrors: string[] = [];
    const tag = cateRecord.name;
    const tagCode = cateRecord.code;

    const url = `https://book.douban.com/tag/${encodeURIComponent(tag)}?type=S&start=${start}`;
    console.log(`[Crawler] Fetching ${tag} at start=${start}`);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.getRandomUserAgent() }
      });

      if (!response.ok) {
        if (response.status === 403) {
          await this.updateCateProgress(cateRecord.id, { status: 'failed' });
          return { count: 0, message: 'IP Blocked', errors: ['403'] };
        }
        return { count: 0, message: `HTTP ${response.status}`, errors: [response.statusText] };
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const items = $('.subject-item');
      
      if (items.length === 0) {
        await this.updateCateProgress(cateRecord.id, { status: 'done' });
        return { count: 0, message: 'Category completed', tag: 'DONE' } as any;
      }

      let pageCrawled = 0;
      for (const element of items.toArray()) {
          const el = $(element);
          const titleLink = el.find('h2 a');
          const title = titleLink.text().replace(/\s+/g, ' ').trim();
          const bookUrl = titleLink.attr('href') || '';
          const pubInfoRaw = el.find('.pub').text().trim();
          const ratingStr = el.find('.rating_nums').text().trim();
          const coverImage = el.find('.pic img').attr('src') || '';
          const summary = el.find('p').text().trim();

          const pubParts = pubInfoRaw.split('/').map(s => s.trim());
          let price = '', date = '', publisher = '', author = '';
          if (pubParts.length > 0) {
              if (pubParts[pubParts.length - 1].match(/\d/)) price = pubParts.pop() || '';
              if (pubParts.length > 0 && pubParts[pubParts.length - 1].match(/\d{4}/)) date = pubParts.pop() || '';
              if (pubParts.length > 0) publisher = pubParts.pop() || '';
              author = pubParts.join(' / ');
          }

          const error = await this.saveBook({
              title,
              url: bookUrl,
              tagCode,
              author,
              publisher,
              publishDate: date,
              price,
              rating: parseFloat(ratingStr) || 0,
              coverImage,
              summary
          });
          
          if (error) saveErrors.push(error);
          pageCrawled++;
      }
      
      const newTotal = totalCrawled + pageCrawled;
      const newStart = start + batchSize;
      
      await this.updateCateProgress(String(cateRecord.id), { 
        status: 'processing', 
        bookCount: newTotal, 
        lastStart: newStart 
      });

      return { count: pageCrawled, message: `Processed ${tag}. Total: ${newTotal}` };

    } catch (error) {
      console.error('[Crawler] Error crawling:', error);
      return { count: 0, message: 'Runtime error', errors: [String(error)] };
    }
  }

  async scheduledCrawl(): Promise<{ count: number; message: string; tag: string }> {
    const check = await execute(sql`SELECT COUNT(*) as count FROM categories`);
    if (check[0].count === 0) {
      await this.discoverCategories();
    }

    const leaf = await this.getNextLeafToProcess();
    
    if (!leaf) {
      console.log('[Crawler] Full cycle complete. Resetting queue.');
      await execute(sql`UPDATE categories SET status = 'pending', last_start = 0 WHERE level = 2`);
      return { count: 0, message: 'All done', tag: 'NONE' };
    }

    const result = await this.crawlDoubanBooks(leaf);
    this.fixIncompleteBooks().catch(e => console.error('[Crawler] Fix failed:', e));
    
    return { ...result, tag: leaf.name };
  }

  async fixIncompleteBooks(limit: number = 5): Promise<void> {
    try {
      const booksToFix = await execute(
        sql`SELECT * FROM books WHERE cover_image IS NULL OR cover_image = '' OR cover_image LIKE '%default%' LIMIT ${limit}`
      );
      if (booksToFix.length === 0) return;

      for (const book of booksToFix) {
        const details = await this.crawlBookDetail(book.url);
        if (details && details.coverImage) {
          await execute(sql`
            UPDATE books SET 
              cover_image = ${details.coverImage},
              summary = COALESCE(${details.summary}, summary),
              rating = COALESCE(${details.rating}, rating)
            WHERE id = ${String(book.id)}
          `);
        }
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
      }
    } catch (e) { console.error('[Crawler] Fix error:', e); }
  }

  private async crawlBookDetail(url: string): Promise<any | null> {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': this.getRandomUserAgent() } });
      if (!response.ok) return null;
      const $ = cheerio.load(await response.text());
      return {
        coverImage: $('#mainpic img').attr('src') || '',
        summary: $('#link-report .intro').first().text().trim() || $('.related_info .intro').first().text().trim(),
        rating: parseFloat($('.rating_num').text().trim()) || undefined
      };
    } catch (e) { return null; }
  }

  private async saveBook(book: any): Promise<string | null> {
    try {
        let priceInt = 0;
        if (book.price) {
          if (typeof book.price === 'number') priceInt = Math.round(book.price * 100);
          else {
            const match = String(book.price).match(/([0-9.]+)/);
            if (match) priceInt = Math.round(parseFloat(match[1]) * 100);
          }
        }
        await execute(sql`
            INSERT INTO books (
                title, url, url_hash, author, publisher, publish_date, price, rating, cover_image, summary, tag_code
            ) VALUES (
                ${book.title}, ${book.url}, MD5(${book.url}), ${book.author}, ${book.publisher}, ${book.publishDate}, 
                ${priceInt}, ${book.rating}, ${book.coverImage}, ${book.summary}, ${book.tagCode}
            )
            ON DUPLICATE KEY UPDATE
                rating = VALUES(rating),
                cover_image = VALUES(cover_image),
                summary = VALUES(summary),
                tag_code = VALUES(tag_code)
        `);
        return null;
    } catch (e: any) {
        return e.message;
    }
  }

  async getBooks(params: BookQueryParams): Promise<{ books: Book[]; total: number }> {
    const { page = 1, pageSize = 10, search = '', tagCodes = [], minRating, maxRating, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const offset = (page - 1) * pageSize;

    try {
      const conditions = [sql`1=1`];
      if (search) {
        const pattern = `%${search}%`;
        conditions.push(sql`(title LIKE ${pattern} OR author LIKE ${pattern} OR publisher LIKE ${pattern})`);
      }
      if (tagCodes && tagCodes.length > 0) {
        const placeholders = sql.join(tagCodes.map(c => sql`${c}`), sql`, `);
        conditions.push(sql`tag_code IN (${placeholders})`);
      }
      if (minRating !== undefined) conditions.push(sql`rating >= ${minRating}`);
      if (maxRating !== undefined) conditions.push(sql`rating <= ${maxRating}`);

      const whereClause = sql.join(conditions, sql` AND `);
      let sortColumn = sql`created_at`;
      if (sortBy === 'rating') sortColumn = sql`rating`;
      if (sortBy === 'title') sortColumn = sql`title`;
      const order = sortOrder === 'asc' ? sql`ASC` : sql`DESC`;

      const countResult = await execute(sql`SELECT COUNT(*) as total FROM books WHERE ${whereClause}`);
      const total = countResult[0]?.total || 0;
      const rawBooks = await execute(sql`SELECT * FROM books WHERE ${whereClause} ORDER BY ${sortColumn} ${order} LIMIT ${pageSize} OFFSET ${offset}`);

      const books = rawBooks.map((b: any) => ({
        ...b,
        id: String(b.id) // Ensure BigInt is string
      }));

      return { books, total };
    } catch (e) {
      console.error('[Crawler] getBooks error:', e);
      return { books: [], total: 0 };
    }
  }

  async getBookById(id: string): Promise<Book | null> {
    try {
      const result = await execute(sql`SELECT * FROM books WHERE id = ${id}`);
      if (result[0]) {
        return { ...result[0], id: String(result[0].id) };
      }
      return null;
    } catch (e) { return null; }
  }
}
