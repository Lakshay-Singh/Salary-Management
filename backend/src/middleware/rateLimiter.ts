import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../errors';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** 5 login attempts per IP per 15 minutes. Each call creates its own counter. */
export function createLoginRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError('Too many login attempts, try again in 15 minutes'));
    },
  });
}
