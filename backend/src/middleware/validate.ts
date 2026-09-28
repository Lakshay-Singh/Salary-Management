import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/** Replaces req.body with the parsed value. A ZodError reaches the error handler and becomes a 400. */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}
