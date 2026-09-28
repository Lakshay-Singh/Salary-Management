import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../errors';
import { verifyToken, type AuthUser } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// The auth scheme is case-insensitive (RFC 7235); the token is everything after one space
const BEARER = /^Bearer (\S+)$/i;

export function requireAuth(jwtSecret: string): RequestHandler {
  return (req, _res, next) => {
    const token = BEARER.exec(req.headers.authorization ?? '')?.[1];
    if (!token) {
      next(new UnauthorizedError('Missing bearer token'));
      return;
    }

    try {
      req.user = verifyToken(token, jwtSecret);
    } catch {
      next(new UnauthorizedError('Invalid or expired token'));
      return;
    }
    next();
  };
}
