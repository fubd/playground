
import { inject } from 'inversify';
import { TYPES } from '../types.js';
import { SystemService } from '../services/system.service.js';
import { Context } from 'hono';
import { Controller, Get } from '../framework/decorators.js';

@Controller('/api')
export class SystemController {
  constructor(@inject(TYPES.SystemService) private systemService: SystemService) {}

  @Get('/system-info')
  public async getInfo(c: Context) {
    const info = await this.systemService.getSystemInfo();
    return c.json(info);
  }
}
