import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express route handler to automatically forward any
 * rejected promise (thrown error) to the global error handler via next().
 * This eliminates the need for try/catch in every controller.
 *
 * Usage: router.get('/path', asyncHandler(myController));
 */
export const asyncHandler =
  (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
