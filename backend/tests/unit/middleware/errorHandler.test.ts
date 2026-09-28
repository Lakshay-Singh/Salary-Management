import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { AppError, NotFoundError } from '../../../src/errors';
import { errorHandler } from '../../../src/middleware/errorHandler';

function appThatFails(fail: () => unknown) {
  const logger = { error: jest.fn() };
  const app = express();
  app.get('/sync', () => {
    fail();
  });
  app.get('/async', async () => {
    await Promise.resolve();
    fail();
  });
  app.use(errorHandler(logger));
  return { app, logger };
}

describe('errorHandler', () => {
  it("responds with an AppError's status, code and message", async () => {
    const { app } = appThatFails(() => {
      throw new AppError(409, 'CONFLICT', 'Employee already exists');
    });

    const res = await request(app).get('/sync');

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: 'CONFLICT', message: 'Employee already exists' } });
  });

  it('includes field details when the AppError has them', async () => {
    const details = [{ field: 'countryCode', message: 'Unknown country' }];
    const { app } = appThatFails(() => {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid employee', details);
    });

    const res = await request(app).get('/sync');

    expect(res.body.error.details).toEqual(details);
  });

  it('turns a ZodError into a 400 with one detail per invalid field', async () => {
    const employee = z.object({ fullName: z.string().min(1), salary: z.number().positive() });
    const { app } = appThatFails(() => employee.parse({ fullName: '', salary: -5 }));

    const res = await request(app).get('/sync');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      { field: 'fullName', message: expect.any(String) },
      { field: 'salary', message: expect.any(String) },
    ]);
  });

  it('handles errors thrown by async handlers', async () => {
    const { app } = appThatFails(() => {
      throw new NotFoundError('Employee 42 not found');
    });

    const res = await request(app).get('/async');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Employee 42 not found' } });
  });

  it('hides an unexpected error behind a generic 500 and logs it', async () => {
    const failure = new Error('connection to db.internal:5432 refused');
    const { app, logger } = appThatFails(() => {
      throw failure;
    });

    const res = await request(app).get('/sync');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
    expect(logger.error).toHaveBeenCalledWith(failure);
  });

  it('does not log expected errors', async () => {
    const { app, logger } = appThatFails(() => {
      throw new NotFoundError();
    });

    await request(app).get('/sync');

    expect(logger.error).not.toHaveBeenCalled();
  });
});
