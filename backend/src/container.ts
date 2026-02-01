import { Container } from 'inversify';
import { TYPES } from './types.js';
import { getDb } from './db/connection.js';
import { SystemService } from './services/system.service.js';
import { MetricsService } from './services/metrics.service.js';
import { TodoService } from './services/todo.service.js';
import { FileService } from './services/file.service.js';
import { MockService } from './services/mock.service.js';
import { CrawlerService } from './services/crawler.service.js';

const container = new Container();

// Bind Database
container.bind(TYPES.Db).toDynamicValue(() => getDb());

// Bind Services
container.bind<SystemService>(TYPES.SystemService).to(SystemService).inSingletonScope();
container.bind<MetricsService>(TYPES.MetricsService).to(MetricsService).inSingletonScope();
container.bind<TodoService>(TYPES.TodoService).to(TodoService).inSingletonScope();
container.bind<FileService>(TYPES.FileService).to(FileService).inSingletonScope();
container.bind<MockService>(TYPES.MockService).to(MockService).inSingletonScope();
container.bind<CrawlerService>(TYPES.CrawlerService).to(CrawlerService).inSingletonScope();

import { Scheduler } from './framework/scheduler.js';
container.bind<Scheduler>(TYPES.Scheduler).to(Scheduler).inSingletonScope();

// Controllers
import { MockController } from './controllers/mock.controller.js';
import { TodoController } from './controllers/todo.controller.js';
import { FileController } from './controllers/file.controller.js';
import { MetricsController } from './controllers/metrics.controller.js';
import { SystemController } from './controllers/system.controller.js';
import { CrawlerController } from './controllers/crawler.controller.js';

container.bind(MockController).toSelf().inSingletonScope();
container.bind(TodoController).toSelf().inSingletonScope();
container.bind(FileController).toSelf().inSingletonScope();
container.bind(MetricsController).toSelf().inSingletonScope();
container.bind(SystemController).toSelf().inSingletonScope();
container.bind(CrawlerController).toSelf().inSingletonScope();

export { container };
