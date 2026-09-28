import type { Config } from '../config/config';
import { InvalidCredentialsError } from '../errors';
import { signToken } from '../lib/jwt';
import { verifyPassword } from '../lib/password';

export interface Credentials {
  username: string;
  password: string;
}

export interface AuthService {
  /** Returns a signed JWT for the HR Manager, or throws InvalidCredentialsError. */
  login(credentials: Credentials): Promise<string>;
}

type AuthConfig = Pick<Config, 'hrUsername' | 'hrPasswordHash' | 'jwtSecret'>;

export function createAuthService({ hrUsername, hrPasswordHash, jwtSecret }: AuthConfig): AuthService {
  return {
    async login({ username, password }) {
      // Always run bcrypt, even for a wrong username, so response time doesn't reveal which usernames exist
      const passwordMatches = await verifyPassword(password, hrPasswordHash);
      if (username !== hrUsername || !passwordMatches) {
        throw new InvalidCredentialsError();
      }
      return signToken({ username }, jwtSecret);
    },
  };
}
