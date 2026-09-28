import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../../src/lib/jwt';
import { TEST_JWT_SECRET } from '../../helpers/auth';

describe('signToken', () => {
  it('issues an HS256 token for the user that expires after 8 hours', () => {
    const token = signToken({ username: 'hr.manager' }, TEST_JWT_SECRET);

    const decoded = jwt.decode(token, { complete: true });
    const payload = decoded?.payload as jwt.JwtPayload;
    expect(decoded?.header.alg).toBe('HS256');
    expect(payload.sub).toBe('hr.manager');
    expect(payload.exp! - payload.iat!).toBe(8 * 60 * 60);
  });
});

describe('verifyToken', () => {
  it('returns the user the token was issued for', () => {
    const token = signToken({ username: 'hr.manager' }, TEST_JWT_SECRET);

    expect(verifyToken(token, TEST_JWT_SECRET)).toEqual({ username: 'hr.manager' });
  });
});
