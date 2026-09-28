import jwt from 'jsonwebtoken';

const ALGORITHM = 'HS256';
const TOKEN_LIFETIME = '8h'; // one working day; no refresh tokens

export interface AuthUser {
  username: string;
}

export function signToken(user: AuthUser, secret: string): string {
  return jwt.sign({}, secret, { algorithm: ALGORITHM, subject: user.username, expiresIn: TOKEN_LIFETIME });
}

/** Throws if the token is malformed, expired, signed with another key or algorithm, or has no subject. */
export function verifyToken(token: string, secret: string): AuthUser {
  const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw new jwt.JsonWebTokenError('token has no subject');
  }
  return { username: payload.sub };
}
