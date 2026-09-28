import type { PrismaClient } from '@prisma/client';
import type { AnalyticsRepository, CountryStats, JobTitleStats } from '../analytics.repository';

// The only raw SQL in the app: Prisma's groupBy has no median.
// Every aggregate is cast to int so results arrive as plain JS numbers, not BigInt (COUNT) or Decimal (AVG).
// Averages and medians are rounded as numeric, which breaks ties away from zero; double precision would round half to even.
export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getCountryStats(): Promise<CountryStats[]> {
    return this.prisma.$queryRaw<CountryStats[]>`
      SELECT
        e.country_code AS "countryCode",
        c.currency_code AS "currencyCode",
        COUNT(*)::int AS "headcount",
        MIN(e.salary)::int AS "min",
        MAX(e.salary)::int AS "max",
        ROUND(AVG(e.salary))::int AS "average",
        ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.salary))::numeric)::int AS "median"
      FROM employees e
      JOIN countries c ON c.code = e.country_code
      GROUP BY e.country_code, c.currency_code
      ORDER BY e.country_code
    `;
  }

  async getJobTitleStats(countryCode: string): Promise<JobTitleStats[] | null> {
    const country = await this.prisma.country.findUnique({ where: { code: countryCode }, select: { code: true } });
    if (!country) return null;

    return this.prisma.$queryRaw<JobTitleStats[]>`
      SELECT
        job_title AS "jobTitle",
        COUNT(*)::int AS "headcount",
        MIN(salary)::int AS "min",
        ROUND(AVG(salary))::int AS "average",
        MAX(salary)::int AS "max"
      FROM employees
      WHERE country_code = ${countryCode}
      GROUP BY job_title
      ORDER BY job_title
    `;
  }
}
