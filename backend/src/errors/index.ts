export interface FieldError {
  field: string;
  message: string;
}

/** An expected failure with a known HTTP status. Anything else reaching the error handler is a 500. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: FieldError[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(details: FieldError[]) {
    super(400, 'VALIDATION_ERROR', 'Request validation failed', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class EmployeeNotFoundError extends NotFoundError {
  constructor(id: number | string) {
    super(`Employee ${id} not found`);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests, try again later') {
    super(429, 'TOO_MANY_REQUESTS', message);
  }
}
