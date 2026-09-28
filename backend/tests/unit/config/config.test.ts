import { ConfigError, loadConfig } from '../../../src/config/config';

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@pooler.neon.tech/salaries?sslmode=require',
  DIRECT_URL: 'postgresql://user:pass@direct.neon.tech/salaries?sslmode=require',
  ALLOWED_ORIGIN: 'https://salary-management.vercel.app',
  JWT_SECRET: 'x'.repeat(32),
  HR_USERNAME: 'hr.manager',
  HR_PASSWORD_HASH: `$2b$12$${'a'.repeat(53)}`,
};

function configErrorFor(env: Record<string, string | undefined>): string {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) return error.message;
    throw error;
  }
  throw new Error('expected loadConfig to throw a ConfigError');
}

describe('loadConfig', () => {
  it('returns typed config from a valid environment', () => {
    expect(loadConfig({ ...validEnv, NODE_ENV: 'production', PORT: '8080' })).toEqual({
      nodeEnv: 'production',
      port: 8080,
      databaseUrl: validEnv.DATABASE_URL,
      directUrl: validEnv.DIRECT_URL,
      allowedOrigin: validEnv.ALLOWED_ORIGIN,
      jwtSecret: validEnv.JWT_SECRET,
      hrUsername: validEnv.HR_USERNAME,
      hrPasswordHash: validEnv.HR_PASSWORD_HASH,
    });
  });

  it('defaults NODE_ENV to development and PORT to 3000', () => {
    const config = loadConfig(validEnv);

    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3000);
  });

  it('lists every missing variable in a single error', () => {
    const message = configErrorFor({});

    for (const name of Object.keys(validEnv)) {
      expect(message).toContain(`${name}: is missing`);
    }
  });

  it('treats an empty value as missing', () => {
    expect(configErrorFor({ ...validEnv, JWT_SECRET: '' })).toContain('JWT_SECRET: is missing');
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(configErrorFor({ ...validEnv, JWT_SECRET: 'x'.repeat(31) })).toContain(
      'JWT_SECRET: must be at least 32 characters',
    );
  });

  it.each(['https://salary-management.vercel.app/', 'https://salary-management.vercel.app/login', 'not a url'])(
    'rejects ALLOWED_ORIGIN %p because CORS matches exact origins only',
    (origin) => {
      expect(configErrorFor({ ...validEnv, ALLOWED_ORIGIN: origin })).toContain('ALLOWED_ORIGIN:');
    },
  );

  it('rejects an HR_PASSWORD_HASH that is not a bcrypt hash, such as a plain password', () => {
    expect(configErrorFor({ ...validEnv, HR_PASSWORD_HASH: 'hunter2' })).toContain(
      'HR_PASSWORD_HASH: must be a bcrypt hash',
    );
  });

  it('never echoes secret values in the error', () => {
    const message = configErrorFor({ ...validEnv, JWT_SECRET: 'too-short-secret', HR_PASSWORD_HASH: 'hunter2' });

    expect(message).not.toContain('too-short-secret');
    expect(message).not.toContain('hunter2');
  });
});
