import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/** Replaces req.body with the parsed value. A ZodError reaches the error handler and becomes a 400. */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}

/** Puts the parsed query in res.locals.query: Express 5 makes req.query read-only, so it can't be replaced. */
export function validateQuery(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    res.locals.query = schema.parse(req.query);
    next();
  };
}
