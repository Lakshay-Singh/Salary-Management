import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

// The integration tests truncate tables, so they always use .env.test, overriding anything set in the shell
const testEnv = parseEnv(readFileSync(path.resolve(__dirname, '../../../.env.test'), 'utf8'));
Object.assign(process.env, testEnv);

for (const variable of ['DATABASE_URL', 'DIRECT_URL']) {
  const databaseName = new URL(process.env[variable] ?? 'postgresql://missing/').pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to run integration tests: ${variable} points at "${databaseName}", not a *_test database`);
  }
}
