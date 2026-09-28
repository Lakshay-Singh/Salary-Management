import type { Express } from 'express';
import request from 'supertest';
import { bearerFor } from '../../helpers/auth';
import { InMemoryCountryRepository, InMemoryEmployeeRepository, TEST_COUNTRIES } from '../../helpers/fakeRepositories';
import { buildTestApp } from '../../helpers/testApp';

const AUTHORIZATION = bearerFor();

const [INDIA, UNITED_STATES] = TEST_COUNTRIES;
const GERMANY = { code: 'DE', name: 'Germany', currencyCode: 'EUR' };
const UNITED_KINGDOM = { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP' };

describe('GET /api/countries', () => {
  const getCountries = (app: Express) => request(app).get('/api/countries').set('Authorization', AUTHORIZATION);
  const appWithCountries = (...countries: (typeof INDIA)[]) =>
    buildTestApp({ countries: new InMemoryCountryRepository(countries) });

  it('returns 401 without a token', async () => {
    const res = await request(buildTestApp()).get('/api/countries');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns each country as its code, name and currency', async () => {
    const res = await getCountries(appWithCountries(INDIA, UNITED_STATES));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { countryCode: 'IN', name: 'India', currencyCode: 'INR' },
      { countryCode: 'US', name: 'United States', currencyCode: 'USD' },
    ]);
  });

  it('returns every supported country, not a subset', async () => {
    const res = await getCountries(appWithCountries(INDIA, UNITED_STATES, GERMANY, UNITED_KINGDOM));

    expect(res.status).toBe(200);
    expect(res.body.map((country: { countryCode: string }) => country.countryCode).sort()).toEqual([
      'DE',
      'GB',
      'IN',
      'US',
    ]);
  });

  it('sorts the countries by name', async () => {
    const res = await getCountries(appWithCountries(UNITED_STATES, INDIA, UNITED_KINGDOM));

    expect(res.status).toBe(200);
    expect(res.body.map((country: { name: string }) => country.name)).toEqual([
      'India',
      'United Kingdom',
      'United States',
    ]);
  });
});

describe('GET /api/job-titles', () => {
  let employees: InMemoryEmployeeRepository;
  let app: Express;

  beforeEach(() => {
    employees = new InMemoryEmployeeRepository();
    app = buildTestApp({ employees });
  });

  const getJobTitles = (query: Record<string, string> = {}) =>
    request(app).get('/api/job-titles').query(query).set('Authorization', AUTHORIZATION);

  const givenStaff = async (...staff: { jobTitle: string; countryCode: string }[]) => {
    for (const person of staff) {
      await employees.create({ fullName: 'Test Person', salary: 1_000_000, ...person });
    }
  };

  const mixedStaff = [
    { jobTitle: 'Software Engineer', countryCode: 'IN' },
    { jobTitle: 'Data Analyst', countryCode: 'US' },
    { jobTitle: 'Software Engineer', countryCode: 'US' },
    { jobTitle: 'Engineering Manager', countryCode: 'IN' },
  ];

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/job-titles');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns each job title once, sorted alphabetically', async () => {
    await givenStaff(...mixedStaff);

    const res = await getJobTitles();

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['Data Analyst', 'Engineering Manager', 'Software Engineer']);
  });

  it('returns only the job titles held in the given country', async () => {
    await givenStaff(...mixedStaff);

    const res = await getJobTitles({ countryCode: 'IN' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['Engineering Manager', 'Software Engineer']);
  });

  it('returns an empty array, not a 404, for a country with no employees', async () => {
    await givenStaff({ jobTitle: 'Software Engineer', countryCode: 'IN' });

    const res = await getJobTitles({ countryCode: 'US' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
