import type { RequestHandler } from 'express';
import type { AuthService } from '../services/auth.service';
import type { LoginRequest } from '../validation/auth.schemas';

type LoginHandler = RequestHandler<Record<string, string>, { token: string }, LoginRequest>;

export function createAuthController(authService: AuthService) {
  const login: LoginHandler = async (req, res) => {
    const token = await authService.login(req.body);
    res.status(200).json({ token });
  };

  return { login };
}

export type AuthController = ReturnType<typeof createAuthController>;
