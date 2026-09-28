import bcrypt from 'bcrypt';
import { createApp } from '../../src/app';
import type { Config } from '../../src/config/config';
import type { AnalyticsRepository } from '../../src/repositories/analytics.repository';
import type { CountryRepository } from '../../src/repositories/country.repository';
import type { EmployeeRepository } from '../../src/repositories/employee.repository';
import { TEST_JWT_SECRET, TEST_PASSWORD, TEST_USERNAME } from './auth';
import { InMemoryCountryRepository, InMemoryEmployeeRepository } from './fakeRepositories';

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

interface TestAppOptions {
  employees?: EmployeeRepository;
  countries?: CountryRepository;
  analytics?: AnalyticsRepository;
}

export function buildTestApp({
  employees = new InMemoryEmployeeRepository(),
  countries = new InMemoryCountryRepository(),
  analytics,
}: TestAppOptions = {}) {
  return createApp({
    config: TEST_CONFIG,
    logger: { error: jest.fn() },
    repositories: { employees, countries, analytics },
  });
}
