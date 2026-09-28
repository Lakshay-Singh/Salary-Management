import { execSync } from 'node:child_process';
import path from 'node:path';
import './useTestDatabase';

/** Runs once before the integration suite: brings the test database up to the latest migration. */
export default function migrateTestDatabase(): void {
  execSync('npx prisma migrate deploy', { cwd: path.resolve(__dirname, '../../..'), stdio: 'inherit' });
}
