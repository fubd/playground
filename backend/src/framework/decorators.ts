
import 'reflect-metadata';
import { METADATA_KEYS } from './constants.js';
import { injectable } from 'inversify';

export interface RouteDefinition {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  handlerName: string;
}

export const Controller = (prefix: string = ''): ClassDecorator => {
  return (target: any) => {
    Reflect.defineMetadata(METADATA_KEYS.controller, prefix, target);
    injectable()(target);
  };
};

const createMethodDecorator = (method: RouteDefinition['method']) => {
  return (path: string = '/'): MethodDecorator => {
    return (target: any, propertyKey: string | symbol) => {
      if (!Reflect.hasMetadata(METADATA_KEYS.routes, target.constructor)) {
        Reflect.defineMetadata(METADATA_KEYS.routes, [], target.constructor);
      }
      const routes = Reflect.getMetadata(METADATA_KEYS.routes, target.constructor) as RouteDefinition[];
      routes.push({
        method,
        path,
        handlerName: propertyKey.toString(),
      });
      Reflect.defineMetadata(METADATA_KEYS.routes, routes, target.constructor);
    };
  };
};

export const Get = createMethodDecorator('get');
export const Post = createMethodDecorator('post');
export const Put = createMethodDecorator('put');
export const Delete = createMethodDecorator('delete');
export const Patch = createMethodDecorator('patch');
