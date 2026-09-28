import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { signToken } from '../../../src/lib/jwt';
import { errorHandler } from '../../../src/middleware/errorHandler';
import { requireAuth } from '../../../src/middleware/requireAuth';
import { TEST_JWT_SECRET, bearerFor } from '../../helpers/auth';

const app = express();
app.get('/protected', requireAuth(TEST_JWT_SECRET), (req, res) => {
  res.json({ user: req.user });
});
app.use(errorHandler({ error: jest.fn() }));

function getProtected(authorization?: string) {
  const req = request(app).get('/protected');
  return authorization === undefined ? req : req.set('Authorization', authorization);
}

const nowInSeconds = () => Math.floor(Date.now() / 1000);

describe('requireAuth', () => {
  it('lets a request with a valid token through and exposes the user', async () => {
    const res = await getProtected(bearerFor('hr.manager'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { username: 'hr.manager' } });
  });

  it('accepts the Bearer scheme in any letter case', async () => {
    const token = signToken({ username: 'hr.manager' }, TEST_JWT_SECRET);

    const res = await getProtected(`bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it.each<[string, string | undefined]>([
    ['no Authorization header', undefined],
    ['a non-Bearer scheme', `Basic ${Buffer.from('hr:password').toString('base64')}`],
    ['a Bearer header without a token', 'Bearer '],
    ['a malformed token', 'Bearer not-a-jwt'],
    ['a token signed with another secret', `Bearer ${signToken({ username: 'hr' }, 'another-secret-of-at-least-32-chars!')}`],
    ['an expired token', `Bearer ${jwt.sign({ sub: 'hr', exp: nowInSeconds() - 60 }, TEST_JWT_SECRET)}`],
    ['a token signed with another algorithm', `Bearer ${jwt.sign({ sub: 'hr' }, TEST_JWT_SECRET, { algorithm: 'HS512' })}`],
    ['a token without a subject', `Bearer ${jwt.sign({}, TEST_JWT_SECRET)}`],
  ])('rejects %s with 401', async (_case, authorization) => {
    const res = await getProtected(authorization);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHORIZED', message: expect.any(String) } });
  });
});
