import { signToken } from '../../src/lib/jwt';

export const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters';
export const TEST_USERNAME = 'hr.manager';
export const TEST_PASSWORD = 'correct-horse-battery-staple';

export function bearerFor(username = TEST_USERNAME): string {
  return `Bearer ${signToken({ username }, TEST_JWT_SECRET)}`;
}
