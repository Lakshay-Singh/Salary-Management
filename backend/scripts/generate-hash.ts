// One-off: prints the bcrypt hash to store in HR_PASSWORD_HASH.
// Usage: npm run hash-password -- '<password>'
import { hashPassword } from '../src/lib/password';

async function main(): Promise<void> {
  const password = process.argv[2];
  if (!password) {
    console.error("Usage: npm run hash-password -- '<password>'");
    process.exit(1);
  }
  console.log(await hashPassword(password));
}

void main();
