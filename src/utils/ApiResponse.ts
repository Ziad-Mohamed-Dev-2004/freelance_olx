import { Response } from 'express';

/**
 * Provides static methods to send standardized JSON responses.
 * Every API response will conform to one of two shapes:
 *
 * Success: { success: true,  message: string, data: T }
 * Error:   { success: false, message: string, errors?: object[] }
 */
export class ApiResponse {
  /**
   * Send a success response.
   * @param res    Express Response object
   * @param statusCode HTTP status code (default 200)
   * @param message  Human-readable success message
   * @param data   Payload to include in the response
   */
  static success<T>(res: Response, statusCode = 200, message = 'Success', data?: T): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data ?? null,
    });
  }

  /**
   * Send an error response (used directly, NOT via global handler).
   * Prefer throwing AppError subclasses instead; this is for edge cases.
   */
  static error(
    res: Response,
    statusCode = 500,
    message = 'Internal Server Error',
    errors?: Record<string, unknown>[],
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: errors ?? [],
    });
  }
}
