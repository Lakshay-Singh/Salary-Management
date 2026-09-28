import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE employees, countries RESTART IDENTITY CASCADE`;
}
