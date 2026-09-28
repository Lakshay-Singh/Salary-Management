import bcrypt from 'bcrypt';
import { createApp } from '../../src/app';
import type { Config } from '../../src/config/config';
import { TEST_JWT_SECRET, TEST_PASSWORD, TEST_USERNAME } from './auth';

export const TEST_ORIGIN = 'http://localhost:5173';

// A complete Config, so the app gets whatever it reads.
// Cost 4 keeps bcrypt fast in tests; production hashes use 12.
export const TEST_CONFIG: Config = {
  nodeEnv: 'test',
  port: 0,
  databaseUrl: 'postgresql://test:test@localhost:5432/salaries_test',
  directUrl: 'postgresql://test:test@localhost:5432/salaries_test',
  allowedOrigin: TEST_ORIGIN,
  jwtSecret: TEST_JWT_SECRET,
  hrUsername: TEST_USERNAME,
  hrPasswordHash: bcrypt.hashSync(TEST_PASSWORD, 4),
};

export function buildTestApp() {
  return createApp({ config: TEST_CONFIG, logger: { error: jest.fn() } });
}
