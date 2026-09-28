import type { Express } from 'express';
import request from 'supertest';
import { bearerFor } from '../helpers/auth';
import { invalidFields } from '../helpers/errors';
import { InMemoryEmployeeRepository } from '../helpers/fakeRepositories';
import { buildTestApp } from '../helpers/testApp';

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
});
