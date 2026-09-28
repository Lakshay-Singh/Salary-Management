import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError, type FieldError } from '../errors';

type Logger = Pick<Console, 'error'>;

interface ErrorBody {
  error: { code: string; message: string; details?: FieldError[] };
}

/** Maps every error to one JSON shape. Unexpected errors are logged and hidden behind a generic 500. */
export function errorHandler(logger: Logger = console): ErrorRequestHandler {
  return (err, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const { status, body } = toErrorResponse(err);
    if (status === 500) {
      logger.error(err);
    }
    res.status(status).json(body);
  };
}

function toErrorResponse(thrown: unknown): { status: number; body: ErrorBody } {
  const err = thrown instanceof ZodError ? toValidationError(thrown) : thrown;

  if (err instanceof AppError) {
    return respond(err.statusCode, err.code, err.message, err.details);
  }
  if (isBodyParserError(err, 'entity.parse.failed')) {
    return respond(400, 'INVALID_JSON', 'Request body is not valid JSON');
  }
  if (isBodyParserError(err, 'entity.too.large')) {
    return respond(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  return respond(500, 'INTERNAL_ERROR', 'Something went wrong');
}

function toValidationError(err: ZodError): ValidationError {
  return new ValidationError(
    err.issues.map((issue) => ({ field: issue.path.map(String).join('.'), message: issue.message })),
  );
}

function respond(status: number, code: string, message: string, details?: FieldError[]) {
  return { status, body: { error: details ? { code, message, details } : { code, message } } };
}

// express.json() tags its errors with a `type` instead of using error classes
function isBodyParserError(err: unknown, type: string): boolean {
  return typeof err === 'object' && err !== null && 'type' in err && err.type === type;
}
