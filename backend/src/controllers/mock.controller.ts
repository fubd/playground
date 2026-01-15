
import { inject } from 'inversify';
import { TYPES } from '../types.js';
import { MockService } from '../services/mock.service.js';
import { Context } from 'hono';
import { Controller, Post } from '../framework/decorators.js';

@Controller('/api/mock')
export class MockController {
  constructor(@inject(TYPES.MockService) private mockService: MockService) {}

  @Post('/add')
  public async add(c: Context) {
    try {
      const { title } = await c.req.json();
      const result = await this.mockService.add({ title });
      return c.json(result);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  }
}
