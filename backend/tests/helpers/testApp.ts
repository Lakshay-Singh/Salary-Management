import { createApp } from '../../src/app';
import { TEST_JWT_SECRET } from './auth';

export const TEST_ORIGIN = 'http://localhost:5173';

export function buildTestApp() {
  return createApp({
    config: { allowedOrigin: TEST_ORIGIN, jwtSecret: TEST_JWT_SECRET },
    logger: { error: jest.fn() },
  });
}
