import { Router, type RequestHandler } from 'express';
import type { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { loginSchema } from '../validation/auth.schemas';

export function authRouter(controller: AuthController, loginRateLimiter: RequestHandler): Router {
  return Router().post('/auth/login', loginRateLimiter, validateBody(loginSchema), controller.login);
}
