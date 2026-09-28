// Replaces all countries and employees with the same deterministic 10,000-employee dataset.
// Run with: npx prisma db seed (or npm run db:seed). Safe to re-run: it truncates first.
import { PrismaClient } from '@prisma/client';
import { COUNTRIES } from './seed/data';
import { generateEmployees } from './seed/generate';

const EMPLOYEE_COUNT = 10_000;
const RANDOM_SEED = 20_260_928;
const BATCH_SIZE = 1_000; // 6 columns x 1,000 rows stays far below Postgres's 65,535 parameters per statement
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

// Seeding truncates every table. Anything other than a local database needs SEED_CONFIRM=<database name>,
// so production is only ever seeded on purpose.
function assertSafeTarget(databaseUrl: string | undefined): void {
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.slice(1);
  if (!LOCAL_HOSTS.has(url.hostname) && process.env.SEED_CONFIRM !== databaseName) {
    throw new Error(
      `Refusing to wipe and seed "${databaseName}" on ${url.hostname}. ` +
        `If that is really what you want, run again with SEED_CONFIRM=${databaseName}`,
    );
  }
}

async function main(): Promise<void> {
  assertSafeTarget(process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  const started = Date.now();

  try {
    const employees = generateEmployees(EMPLOYEE_COUNT, RANDOM_SEED);

    // One transaction: a failure part-way leaves the previous data untouched
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`TRUNCATE TABLE employees, countries RESTART IDENTITY CASCADE`;
        await tx.country.createMany({
          data: COUNTRIES.map(({ code, name, currencyCode, currencySymbol }) => ({ code, name, currencyCode, currencySymbol })),
        });
        for (let start = 0; start < employees.length; start += BATCH_SIZE) {
          await tx.employee.createMany({ data: employees.slice(start, start + BATCH_SIZE) });
        }
      },
      { timeout: 120_000 },
    );

    const withStaff = new Set(employees.map((employee) => employee.countryCode)).size;
    console.log(
      `Seeded ${COUNTRIES.length} countries (${withStaff} with staff) and ${employees.length} employees in ${Date.now() - started} ms`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
