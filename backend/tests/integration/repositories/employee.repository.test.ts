import { PrismaEmployeeRepository } from '../../../src/repositories/prisma/employee.repository';
import { describeEmployeeRepositoryContract } from '../../contracts/employeeRepository.contract';
import { prisma, resetDatabase } from '../../helpers/database';

describeEmployeeRepositoryContract('PrismaEmployeeRepository', async () => {
  await resetDatabase();
  await prisma.country.createMany({
    data: [
      { code: 'IN', name: 'India', currencyCode: 'INR', currencySymbol: String.fromCodePoint(0x20b9) },
      { code: 'US', name: 'United States', currencyCode: 'USD', currencySymbol: '$' },
    ],
  });
  return new PrismaEmployeeRepository(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});
