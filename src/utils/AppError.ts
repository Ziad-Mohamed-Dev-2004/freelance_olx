/**
 * Base operational error class for the application.
 * Extends native Error with statusCode, isOperational flag, and optional errors array.
 * Services throw typed sub-classes of AppError; the global error handler catches them.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, unknown>[];

  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, unknown>[],
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 Bad Request — malformed input or business rule violation */
export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errors?: Record<string, unknown>[]) {
    super(message, 400, errors);
  }
}

/** 401 Unauthorized — missing or invalid credentials */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/** 403 Forbidden — authenticated but insufficient permissions */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/** 404 Not Found — resource does not exist */
export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

/** 409 Conflict — duplicate resource or state conflict */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

/** 429 Too Many Requests */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}

/** 500 Internal Server Error — unexpected/programming errors */
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, undefined, false);
  }
}
