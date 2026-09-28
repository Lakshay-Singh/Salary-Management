import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Config } from './config/config';
import { createAuthController } from './controllers/auth.controller';
import { createEmployeeController } from './controllers/employee.controller';
import { createReferenceController } from './controllers/reference.controller';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { createLoginRateLimiter } from './middleware/rateLimiter';
import { requireAuth } from './middleware/requireAuth';
import type { CountryRepository } from './repositories/country.repository';
import type { EmployeeRepository } from './repositories/employee.repository';
import { authRouter } from './routes/auth.routes';
import { employeeRouter } from './routes/employee.routes';
import { healthRouter } from './routes/health.routes';
import { referenceRouter } from './routes/reference.routes';
import { createAuthService } from './services/auth.service';
import { createEmployeeService } from './services/employee.service';
import { createReferenceService } from './services/reference.service';

export interface Repositories {
  employees: EmployeeRepository;
  countries: CountryRepository;
}

export interface AppDependencies {
  config: Pick<Config, 'allowedOrigin' | 'jwtSecret' | 'hrUsername' | 'hrPasswordHash'>;
  repositories: Repositories;
  logger?: Pick<Console, 'error'>;
}

/** Composition root: builds the app without listening, so tests can drive it with supertest. */
export function createApp({ config, repositories, logger = console }: AppDependencies): Express {
  const app = express();

  // Railway's proxy terminates TLS in front of us: trust exactly one hop so req.ip is the client
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: [config.allowedOrigin], // a list, so any other origin gets no Access-Control-Allow-Origin at all
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 7200, // cache preflights for 2h, the most Chromium honours
    }),
  );
  app.use(express.json({ limit: '10kb' }));

  const authController = createAuthController(createAuthService(config));
  const employeeController = createEmployeeController(createEmployeeService(repositories));
  const referenceController = createReferenceController(createReferenceService(repositories));

  // Public routes: no token needed
  app.use('/api', healthRouter);
  app.use('/api', authRouter(authController, createLoginRateLimiter()));

  // Protected by default: every /api route registered below this line requires a valid JWT.
  app.use('/api', requireAuth(config.jwtSecret));
  app.use('/api', employeeRouter(employeeController));
  app.use('/api', referenceRouter(referenceController));

  app.use(notFound);
  app.use(errorHandler(logger));

  return app;
}
