import type { Express } from 'express';
import request from 'supertest';
import { PrismaAnalyticsRepository } from '../../src/repositories/prisma/analytics.repository';
import { bearerFor } from '../helpers/auth';
import { prisma, resetDatabase } from '../helpers/database';
import { buildTestApp } from '../helpers/testApp';

const AUTHORIZATION = bearerFor();

const COUNTRIES = [
  { code: 'IN', name: 'India', currencyCode: 'INR', currencySymbol: String.fromCodePoint(0x20b9) },
  { code: 'US', name: 'United States', currencyCode: 'USD', currencySymbol: '$' },
  { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', currencySymbol: String.fromCodePoint(0x00a3) },
];

const EMPLOYEES = [
  { fullName: 'Asha Rao', jobTitle: 'Software Engineer', countryCode: 'IN', salary: 1_000_000 },
  { fullName: 'Dev Patel', jobTitle: 'Software Engineer', countryCode: 'IN', salary: 1_100_000 },
  { fullName: 'Meera Iyer', jobTitle: 'Engineering Manager', countryCode: 'IN', salary: 2_000_000 },
  { fullName: 'John Smith', jobTitle: 'Software Engineer', countryCode: 'US', salary: 90_000 },
  { fullName: 'Emily Chen', jobTitle: 'Software Engineer', countryCode: 'US', salary: 100_000 },
  { fullName: 'Carlos Diaz', jobTitle: 'Software Engineer', countryCode: 'US', salary: 120_000 },
  { fullName: 'Sarah Lee', jobTitle: 'Engineering Manager', countryCode: 'US', salary: 400_000 },
];

let app: Express;

beforeEach(async () => {
  await resetDatabase();
  await prisma.country.createMany({ data: COUNTRIES });
  await prisma.employee.createMany({ data: EMPLOYEES });
  app = buildTestApp({ analytics: new PrismaAnalyticsRepository(prisma) });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/analytics/countries', () => {
  const getCountryStats = () => request(app).get('/api/analytics/countries').set('Authorization', AUTHORIZATION);
  const statsFor = (body: { countryCode: string }[], countryCode: string) =>
    body.find((stats) => stats.countryCode === countryCode);

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/analytics/countries');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns headcount and salary statistics per country, in whole units of its own currency', async () => {
    const res = await getCountryStats();

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { countryCode: 'IN', headcount: 3, min: 1_000_000, max: 2_000_000, average: 1_366_667, median: 1_100_000 },
      { countryCode: 'US', headcount: 4, min: 90_000, max: 400_000, average: 177_500, median: 110_000 },
    ]);
  });

  it('takes the middle salary as the median when the headcount is odd', async () => {
    const res = await getCountryStats();

    expect(statsFor(res.body, 'IN')).toMatchObject({ headcount: 3, median: 1_100_000 });
  });

  it('takes the mean of the two middle salaries as the median when the headcount is even', async () => {
    const res = await getCountryStats();

    expect(statsFor(res.body, 'US')).toMatchObject({ headcount: 4, median: 110_000 });
  });

  it('rounds the average to the nearest whole unit instead of truncating it', async () => {
    const res = await getCountryStats();

    expect(statsFor(res.body, 'IN')).toMatchObject({ average: 1_366_667 });
  });

  it('leaves out supported countries that have no employees', async () => {
    const res = await getCountryStats();

    expect(statsFor(res.body, 'GB')).toBeUndefined();
  });
});

describe('GET /api/analytics/countries/:countryCode/job-titles', () => {
  const getJobTitleStats = (countryCode: string) =>
    request(app).get(`/api/analytics/countries/${countryCode}/job-titles`).set('Authorization', AUTHORIZATION);

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/analytics/countries/IN/job-titles');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns headcount and salary statistics per job title in that country only, sorted by title', async () => {
    const res = await getJobTitleStats('IN');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { jobTitle: 'Engineering Manager', headcount: 1, min: 2_000_000, average: 2_000_000, max: 2_000_000 },
      { jobTitle: 'Software Engineer', headcount: 2, min: 1_000_000, average: 1_050_000, max: 1_100_000 },
    ]);
  });

  it('returns an empty array for a supported country with no employees', async () => {
    const res = await getJobTitleStats('GB');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 404 for a country code that is not supported', async () => {
    const res = await getJobTitleStats('XX');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Country XX not found' } });
  });
});
