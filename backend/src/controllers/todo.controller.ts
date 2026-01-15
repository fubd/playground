
import { inject } from 'inversify';
import { TYPES } from '../types.js';
import { TodoService } from '../services/todo.service.js';
import { Context } from 'hono';
import { Controller, Get, Post, Put, Delete } from '../framework/decorators.js';

@Controller('/api/todos')
export class TodoController {
  constructor(@inject(TYPES.TodoService) private todoService: TodoService) {}

  @Get('/')
  public async getAll(c: Context) {
    const todoList = await this.todoService.getAll();
    return c.json(todoList);
  }

  @Post('/')
  public async create(c: Context) {
    try {
      const { title } = await c.req.json();
      const newTodo = await this.todoService.create(title);
      if (!newTodo) {
        return c.json({ error: 'Failed' }, 500);
      }
      return c.json(newTodo, 201);
    } catch (error) {
       console.error(error);
       return c.json({error: 'Invalid JSON'}, 400); 
    }
  }

  @Put('/:id')
  public async update(c: Context) {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const success = await this.todoService.update(id, body);
    return c.json({ success });
  }

  @Delete('/:id')
  public async delete(c: Context) {
    const id = parseInt(c.req.param('id'));
    const success = await this.todoService.delete(id);
    return c.json({ success });
  }
}
