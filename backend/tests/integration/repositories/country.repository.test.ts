import { PrismaCountryRepository } from '../../../src/repositories/prisma/country.repository';
import { describeCountryRepositoryContract } from '../../contracts/countryRepository.contract';
import { prisma, resetDatabase } from '../../helpers/database';

describeCountryRepositoryContract('PrismaCountryRepository', async (countries) => {
  await resetDatabase();
  await prisma.country.createMany({
    data: countries.map((country) => ({ ...country, currencySymbol: country.currencyCode })),
  });
  return new PrismaCountryRepository(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});
