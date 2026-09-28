import type { Express } from 'express';
import request from 'supertest';
import { verifyToken } from '../../src/lib/jwt';
import { TEST_JWT_SECRET, TEST_PASSWORD, TEST_USERNAME } from '../helpers/auth';
import { buildTestApp } from '../helpers/testApp';

// Wrong username and wrong password get exactly this response, so the API never reveals which usernames exist
const INVALID_CREDENTIALS = {
  error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
};

interface ErrorBody {
  error: { code: string; details?: { field: string }[] };
}

const invalidFields = (body: ErrorBody) => (body.error.details ?? []).map((detail) => detail.field).sort();

describe('POST /api/auth/login', () => {
  // A fresh app per test gives every test its own rate-limit counter
  let app: Express;
  beforeEach(() => {
    app = buildTestApp();
  });

  const login = (body: object) => request(app).post('/api/auth/login').send(body);

  it('returns a JWT for the configured user when the credentials are valid', async () => {
    const res = await login({ username: TEST_USERNAME, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: expect.any(String) });
    expect(verifyToken(res.body.token, TEST_JWT_SECRET)).toEqual({ username: TEST_USERNAME });
  });

  it('rejects a wrong username with 401 and the same generic message as a wrong password', async () => {
    const res = await login({ username: 'someone.else', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS);
  });

  it('rejects a wrong password with 401 and the generic message', async () => {
    const res = await login({ username: TEST_USERNAME, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS);
  });

  it.each([
    ['both fields', {}, ['password', 'username']],
    ['the username', { password: TEST_PASSWORD }, ['username']],
    ['the password', { username: TEST_USERNAME }, ['password']],
  ])('rejects a request missing %s with 400 and a validation error per field', async (_case, body, fields) => {
    const res = await login(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalidFields(res.body)).toEqual(fields);
  });

  it('rejects empty strings with 400, the same as missing fields', async () => {
    const res = await login({ username: '', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalidFields(res.body)).toEqual(['password', 'username']);
  });

  it('blocks the 6th attempt from the same IP within the window with 429, even with the right password', async () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const res = await login({ username: TEST_USERNAME, password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    const sixth = await login({ username: TEST_USERNAME, password: TEST_PASSWORD });

    expect(sixth.status).toBe(429);
    expect(sixth.body).toEqual({ error: { code: 'TOO_MANY_REQUESTS', message: expect.any(String) } });
  });
});
