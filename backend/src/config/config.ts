import { z } from 'zod';

// bcrypt output: $2a$, $2b$ or $2y$, a two-digit cost, then 53 characters of salt and hash
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  ALLOWED_ORIGIN: z
    .url()
    .refine(isOrigin, 'must be an exact origin such as https://app.vercel.app, with no path or trailing slash'),
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
  HR_USERNAME: z.string(),
  HR_PASSWORD_HASH: z
    .string()
    .regex(BCRYPT_HASH, "must be a bcrypt hash; generate one with: npm run hash-password -- '<password>'"),
});

export interface Config {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  directUrl: string;
  allowedOrigin: string;
  jwtSecret: string;
  hrUsername: string;
  hrPasswordHash: string;
}

export class ConfigError extends Error {
  constructor(problems: string[]) {
    super(`Invalid environment configuration:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

type Env = Record<string, string | undefined>;

/** Validates the environment once at boot. Throws a ConfigError listing every problem, never the values. */
export function loadConfig(env: Env = process.env): Config {
  const values = withoutEmptyValues(env);
  const result = envSchema.safeParse(values);

  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map((issue) => {
        const name = String(issue.path[0]);
        return `${name}: ${values[name] === undefined ? 'is missing' : issue.message}`;
      }),
    );
  }

  const valid = result.data;
  return {
    nodeEnv: valid.NODE_ENV,
    port: valid.PORT,
    databaseUrl: valid.DATABASE_URL,
    directUrl: valid.DIRECT_URL,
    allowedOrigin: valid.ALLOWED_ORIGIN,
    jwtSecret: valid.JWT_SECRET,
    hrUsername: valid.HR_USERNAME,
    hrPasswordHash: valid.HR_PASSWORD_HASH,
  };
}

// "JWT_SECRET=" copied straight from .env.example should read as missing, not as an empty secret
function withoutEmptyValues(env: Env): Env {
  return Object.fromEntries(Object.entries(env).map(([key, value]) => [key, value === '' ? undefined : value]));
}

function isOrigin(value: string): boolean {
  try {
    return new URL(value).origin === value;
  } catch {
    return false;
  }
}
