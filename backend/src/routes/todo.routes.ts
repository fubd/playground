import { Hono } from 'hono';
import { TodoService } from '../services/todo.service.js';

const todoRouter = new Hono();
const todoService = new TodoService();
todoRouter.get('/', async (c) => {
  const todos = await todoService.getAll();
  return c.json(todos);
});

todoRouter.post('/', async (c) => {
  const { title } = await c.req.json();
  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }
  const todo = await todoService.create(title);
  return c.json(todo, 201);
});

todoRouter.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = await c.req.json();
  const success = await todoService.update(id, data);
  if (success) {
    return c.json({ message: 'Updated successfully' });
  }
  return c.json({ error: 'Failed to update' }, 500);
});

todoRouter.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const success = await todoService.delete(id);
  if (success) {
    return c.json({ message: 'Deleted successfully' });
  }
  return c.json({ error: 'Failed to delete' }, 500);
});

export default todoRouter;
