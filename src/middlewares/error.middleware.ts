import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MongoServerError } from 'mongodb';
import logger from '../utils/logger';
import { AppError } from '../utils/AppError';
import { config } from '../config/env.config';

/**
 * Global error handler middleware.
 * Catches all errors forwarded via next(err) and returns a standardized response.
 *
 * Handles:
 * - AppError subclasses (operational errors from services)
 * - Mongoose CastError (invalid ObjectId format → 400)
 * - Mongoose ValidationError (schema validation → 400)
 * - MongoServerError code 11000 (duplicate key → 409)
 * - Everything else → 500 Internal Server Error
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, unknown>[] | undefined;

  // --- Operational errors thrown by our own services ---
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // --- Mongoose invalid ObjectId (e.g. findById with bad format) ---
  else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // --- Mongoose schema validation failure ---
  else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // --- MongoDB duplicate key (e.g. unique email) ---
  else if (err instanceof MongoServerError && err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message = `${field} already exists`;
  }
  // --- Unhandled programming errors ---
  else if (err instanceof Error) {
    message = config.env === 'production' ? 'Internal Server Error' : err.message;
  }

  // Always log server errors
  if (statusCode >= 500) {
    logger.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errors ?? [],
  });
};

/**
 * Middleware for unmatched routes (404).
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errors: [],
  });
};
