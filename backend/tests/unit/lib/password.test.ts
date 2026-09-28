import bcrypt from 'bcrypt';
import { hashPassword } from '../../../src/lib/password';

describe('hashPassword', () => {
  it('produces a cost-12 bcrypt hash that matches only the original password', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(bcrypt.getRounds(hash)).toBe(12);
    await expect(bcrypt.compare('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(bcrypt.compare('wrong password', hash)).resolves.toBe(false);
  });
});
