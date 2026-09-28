import type { PrismaClient } from '@prisma/client';
import type { Country, CountryRepository } from '../country.repository';

const COUNTRY_FIELDS = { code: true, name: true, currencyCode: true } as const;

export class PrismaCountryRepository implements CountryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByCode(code: string): Promise<Country | null> {
    return this.prisma.country.findUnique({ where: { code }, select: COUNTRY_FIELDS });
  }

  findAll(): Promise<Country[]> {
    return this.prisma.country.findMany({ select: COUNTRY_FIELDS });
  }
}
