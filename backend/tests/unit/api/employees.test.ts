import type { Express } from 'express';
import request from 'supertest';
import { bearerFor } from '../../helpers/auth';
import { invalidFields } from '../../helpers/errors';
import { InMemoryEmployeeRepository } from '../../helpers/fakeRepositories';
import { buildTestApp } from '../../helpers/testApp';

const AUTHORIZATION = bearerFor();

const validEmployee = {
  fullName: 'Asha Rao',
  jobTitle: 'Software Engineer',
  countryCode: 'IN',
  salary: 1_800_000,
};

const invalidEmployees: [string, object, string][] = [
  ['a blank full name', { ...validEmployee, fullName: '' }, 'fullName'],
  ['a whitespace-only full name', { ...validEmployee, fullName: '   ' }, 'fullName'],
  ['a blank job title', { ...validEmployee, jobTitle: '' }, 'jobTitle'],
  ['an unknown country', { ...validEmployee, countryCode: 'XX' }, 'countryCode'],
  ['a fractional salary', { ...validEmployee, salary: 1_800_000.5 }, 'salary'],
  ['a negative salary', { ...validEmployee, salary: -1 }, 'salary'],
  ['a zero salary', { ...validEmployee, salary: 0 }, 'salary'],
];

const employeeNotFound = (id: number | string) => ({
  error: { code: 'NOT_FOUND', message: `Employee ${id} not found` },
});

describe('Employee CRUD', () => {
  let employees: InMemoryEmployeeRepository;
  let app: Express;

  beforeEach(() => {
    employees = new InMemoryEmployeeRepository();
    app = buildTestApp({ employees });
  });

  const givenEmployee = () => employees.create(validEmployee);

  const givenEmployees = async (...overrides: Partial<typeof validEmployee>[]) => {
    for (const override of overrides) {
      await employees.create({ ...validEmployee, ...override });
    }
  };

  const createEmployee = (body: object) =>
    request(app).post('/api/employees').set('Authorization', AUTHORIZATION).send(body);
  const getEmployee = (id: number | string) =>
    request(app).get(`/api/employees/${id}`).set('Authorization', AUTHORIZATION);
  const updateEmployee = (id: number | string, body: object) =>
    request(app).put(`/api/employees/${id}`).set('Authorization', AUTHORIZATION).send(body);
  const deleteEmployee = (id: number | string) =>
    request(app).delete(`/api/employees/${id}`).set('Authorization', AUTHORIZATION);

  describe('without a token', () => {
    it.each([
      ['post', '/api/employees'],
      ['get', '/api/employees/1'],
      ['put', '/api/employees/1'],
      ['delete', '/api/employees/1'],
    ] as const)('%s %s returns 401', async (method, path) => {
      const res = await request(app)[method](path);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/employees', () => {
    it('creates the employee and returns 201 with it, including the currency of its country', async () => {
      const res = await createEmployee(validEmployee);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: expect.any(Number), ...validEmployee, currencyCode: 'INR' });
      expect(await employees.findById(res.body.id)).toEqual({ id: res.body.id, ...validEmployee });
    });

    it('ignores a currency sent by the client and derives it from the country', async () => {
      const res = await createEmployee({ ...validEmployee, currencyCode: 'USD' });

      expect(res.status).toBe(201);
      expect(res.body.currencyCode).toBe('INR');
    });

    it('trims whitespace around the full name and job title', async () => {
      const res = await createEmployee({ ...validEmployee, fullName: '  Asha Rao  ', jobTitle: ' Software Engineer ' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ fullName: 'Asha Rao', jobTitle: 'Software Engineer' });
    });

    it.each(invalidEmployees)('rejects %s with 400', async (_case, body, field) => {
      const res = await createEmployee(body);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidFields(res.body)).toEqual([field]);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('returns 200 with the employee, including the currency of its country', async () => {
      const existing = await givenEmployee();

      const res = await getEmployee(existing.id);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ...existing, currencyCode: 'INR' });
    });

    it.each(['999', 'abc'])('returns 404 for the unknown id %p', async (id) => {
      const res = await getEmployee(id);

      expect(res.status).toBe(404);
      expect(res.body).toEqual(employeeNotFound(id));
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('replaces the editable fields and returns 200, with the currency of the new country', async () => {
      const existing = await givenEmployee();
      const changes = { fullName: 'Asha Rao-Menon', jobTitle: 'Engineering Manager', countryCode: 'US', salary: 185_000 };

      const res = await updateEmployee(existing.id, changes);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: existing.id, ...changes, currencyCode: 'USD' });
      expect(await employees.findById(existing.id)).toEqual({ id: existing.id, ...changes });
    });

    it.each(invalidEmployees)('rejects %s with 400 and leaves the employee unchanged', async (_case, body, field) => {
      const existing = await givenEmployee();

      const res = await updateEmployee(existing.id, body);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidFields(res.body)).toEqual([field]);
      expect(await employees.findById(existing.id)).toEqual(existing);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await updateEmployee(999, validEmployee);

      expect(res.status).toBe(404);
      expect(res.body).toEqual(employeeNotFound(999));
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('deletes the employee and returns 204 with no body', async () => {
      const existing = await givenEmployee();

      const res = await deleteEmployee(existing.id);

      expect(res.status).toBe(204);
      expect(res.text).toBe('');
      expect(await employees.findById(existing.id)).toBeNull();
    });

    it('returns 404 for an unknown id', async () => {
      const res = await deleteEmployee(999);

      expect(res.status).toBe(404);
      expect(res.body).toEqual(employeeNotFound(999));
    });
  });

  describe('GET /api/employees', () => {
    const listEmployees = (query: Record<string, string | number> = {}) =>
      request(app).get('/api/employees').query(query).set('Authorization', AUTHORIZATION);

    const numbered = (count: number) =>
      Array.from({ length: count }, (_, index) => ({ fullName: `Employee ${String(index + 1).padStart(2, '0')}` }));

    const namesIn = (body: { data: { fullName: string }[] }) => body.data.map((employee) => employee.fullName);

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/employees');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns the first 25 employees, each with its currency, and the paging totals by default', async () => {
      await givenEmployees(...numbered(30));

      const res = await listEmployees();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: numbered(25).map((override, index) => ({
          id: index + 1,
          ...validEmployee,
          ...override,
          currencyCode: 'INR',
        })),
        page: 1,
        pageSize: 25,
        total: 30,
        totalPages: 2,
      });
    });

    it('returns the requested page', async () => {
      await givenEmployees(...numbered(25));

      const res = await listEmployees({ page: 2, pageSize: 10 });

      expect(res.status).toBe(200);
      expect(namesIn(res.body)).toEqual(namesIn({ data: numbered(25).slice(10, 20) }));
      expect(res.body).toMatchObject({ page: 2, pageSize: 10, total: 25, totalPages: 3 });
    });

    it('filters by country code, and counts only the matches in the total', async () => {
      await givenEmployees(
        { fullName: 'Asha Rao', countryCode: 'IN' },
        { fullName: 'John Smith', countryCode: 'US' },
        { fullName: 'Priya Nair', countryCode: 'IN' },
        { fullName: 'Emily Chen', countryCode: 'US' },
      );

      const res = await listEmployees({ countryCode: 'US' });

      expect(res.status).toBe(200);
      expect(namesIn(res.body).sort()).toEqual(['Emily Chen', 'John Smith']);
      expect(res.body.total).toBe(2);
    });

    it('filters by exact job title, so "Software Engineer" does not match "Senior Software Engineer"', async () => {
      await givenEmployees(
        { fullName: 'Asha Rao', jobTitle: 'Software Engineer' },
        { fullName: 'Dev Patel', jobTitle: 'Senior Software Engineer' },
        { fullName: 'Priya Nair', jobTitle: 'Software Engineer' },
      );

      const res = await listEmployees({ jobTitle: 'Software Engineer' });

      expect(res.status).toBe(200);
      expect(namesIn(res.body).sort()).toEqual(['Asha Rao', 'Priya Nair']);
      expect(res.body.total).toBe(2);
    });

    it('searches names by case-insensitive partial match', async () => {
      await givenEmployees({ fullName: 'Asha Rao' }, { fullName: 'Rahul Sharma' }, { fullName: 'Maria Garcia' });

      const res = await listEmployees({ search: 'SHA' });

      expect(res.status).toBe(200);
      expect(namesIn(res.body).sort()).toEqual(['Asha Rao', 'Rahul Sharma']);
      expect(res.body.total).toBe(2);
    });

    it.each([
      ['asc', ['Low Earner', 'Mid Earner', 'High Earner']],
      ['desc', ['High Earner', 'Mid Earner', 'Low Earner']],
    ])('sorts by salary %s', async (sortOrder, expectedNames) => {
      await givenEmployees(
        { fullName: 'Mid Earner', salary: 2_000_000 },
        { fullName: 'High Earner', salary: 3_000_000 },
        { fullName: 'Low Earner', salary: 1_000_000 },
      );

      const res = await listEmployees({ sortBy: 'salary', sortOrder });

      expect(res.status).toBe(200);
      expect(namesIn(res.body)).toEqual(expectedNames);
    });

    it('rejects a sortBy outside the allowed columns with 400', async () => {
      const res = await listEmployees({ sortBy: 'passwordHash' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(invalidFields(res.body)).toEqual(['sortBy']);
    });

    it('returns an empty page, not a 404, when nothing matches', async () => {
      await givenEmployees({ fullName: 'Asha Rao', countryCode: 'IN' });

      const res = await listEmployees({ countryCode: 'US' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: [], page: 1, pageSize: 25, total: 0, totalPages: 0 });
    });
  });

  describe('GET /api/employees/:id/peer-position', () => {
    const getPeerPosition = (id: number | string) =>
      request(app).get(`/api/employees/${id}/peer-position`).set('Authorization', AUTHORIZATION);

    const sameTitleInAnotherCountry = { countryCode: 'US', jobTitle: validEmployee.jobTitle };
    const anotherTitleInSameCountry = { countryCode: validEmployee.countryCode, jobTitle: 'Engineering Manager' };

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/employees/1/peer-position');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('compares the salary with peers in the same country and job title, excluding the employee', async () => {
      const employee = await employees.create({ ...validEmployee, salary: 1_200_000 });
      await givenEmployees(
        { salary: 900_000 },
        { salary: 1_000_000 },
        { salary: 1_100_000 },
        { ...sameTitleInAnotherCountry, salary: 200_000 },
        { ...anotherTitleInSameCountry, salary: 5_000_000 },
      );

      const res = await getPeerPosition(employee.id);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ peerCount: 3, peerAverage: 1_000_000, percentageDiff: 20, label: 'Above average' });
    });

    it('reports a salary below the peer average as a negative difference', async () => {
      const employee = await employees.create({ ...validEmployee, salary: 850_000 });
      await givenEmployees({ salary: 900_000 }, { salary: 1_000_000 }, { salary: 1_100_000 });

      const res = await getPeerPosition(employee.id);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ peerCount: 3, peerAverage: 1_000_000, percentageDiff: -15, label: 'Below average' });
    });

    it('rounds the peer average to whole currency units and the difference to one decimal place', async () => {
      const employee = await employees.create({ ...validEmployee, salary: 1_200_000 });
      await givenEmployees({ salary: 950_000 }, { salary: 1_000_000 }, { salary: 1_060_000 });

      const res = await getPeerPosition(employee.id);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ peerCount: 3, peerAverage: 1_003_333, percentageDiff: 19.6, label: 'Above average' });
    });

    it.each([0, 2])(
      'returns "Not enough peers" with no average or difference when there are %i peers',
      async (peerCount) => {
        const employee = await employees.create({ ...validEmployee, salary: 1_200_000 });
        await givenEmployees(...Array.from({ length: peerCount }, () => ({ salary: 1_000_000 })));

        const res = await getPeerPosition(employee.id);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ peerCount, peerAverage: null, percentageDiff: null, label: 'Not enough peers' });
      },
    );

    it.each(['999', 'abc'])('returns 404 for the unknown employee id %p', async (id) => {
      const res = await getPeerPosition(id);

      expect(res.status).toBe(404);
      expect(res.body).toEqual(employeeNotFound(id));
    });
  });
});
