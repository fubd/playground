
import { Hono } from 'hono';
import { Container } from 'inversify';
import { METADATA_KEYS } from './constants.js';
import { RouteDefinition } from './decorators.js';

export const registerControllers = (
  app: Hono,
  controllers: any[],
  container: Container
) => {
  controllers.forEach((ControllerClass) => {
    const prefix = Reflect.getMetadata(METADATA_KEYS.controller, ControllerClass);
    if (!prefix) return;

    const routes: RouteDefinition[] = Reflect.getMetadata(METADATA_KEYS.routes, ControllerClass) || [];
    
    // Resolve instance from container
    // We assume controllers are bound to Self in the container
    const controllerInstance = container.get(ControllerClass);

    routes.forEach((route) => {
      let fullPath = (prefix + route.path).replace(/\/+/g, '/');
      if (fullPath !== '/' && fullPath.endsWith('/')) {
        fullPath = fullPath.slice(0, -1);
      }
      
      app[route.method](fullPath, async (c) => {
        const handler = (controllerInstance as any)[route.handlerName];
        if (typeof handler === 'function') {
           return handler.call(controllerInstance, c);
        }
      });
      
      console.log(`[Route] ${route.method.toUpperCase()} ${fullPath} -> ${ControllerClass.name}.${route.handlerName}`);
    });
  });
};
