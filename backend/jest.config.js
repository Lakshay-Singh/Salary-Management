/** Fast suite: no database. Real-Postgres tests live in tests/integration (see jest.integration.config.js). */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
};
