import bcrypt from 'bcrypt';

const COST_FACTOR = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}
