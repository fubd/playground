import { Hono } from "hono";
import { MockService } from "../services/mock.service";

const mockRouter = new Hono();
const mockService = new MockService();

mockRouter.post('/add', async (c) => {
    try {
    const { title } = await c.req.json();  
    const result = await mockService.add({title});
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
})

export default mockRouter;