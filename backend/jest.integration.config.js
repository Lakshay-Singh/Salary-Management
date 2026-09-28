/** Real-Postgres suite: start the database first with `npm run db:up`. Connection details come from .env.test. */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  globalSetup: '<rootDir>/tests/integration/setup/migrateTestDatabase.ts',
  setupFiles: ['<rootDir>/tests/integration/setup/useTestDatabase.ts'],
};
