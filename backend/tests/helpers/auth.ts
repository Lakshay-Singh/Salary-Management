import { signToken } from '../../src/lib/jwt';

export const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

export function bearerFor(username = 'hr.manager'): string {
  return `Bearer ${signToken({ username }, TEST_JWT_SECRET)}`;
}
