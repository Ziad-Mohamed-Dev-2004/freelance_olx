import { Request, Response, NextFunction } from 'express';

/**
 * Custom NoSQL injection sanitizer compatible with Express 5.
 *
 * express-mongo-sanitize is incompatible with Express 5 because it tries to
 * reassign `req.query`, which is defined as a read-only getter in Express 5.
 *
 * This middleware recursively removes any keys that start with '$' or contain '.'
 * from req.body and req.params only (req.query is intentionally skipped).
 */

const stripDangerousKeys = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(stripDangerousKeys);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Drop keys starting with $ (MongoDB operators) or containing . (dot notation injection)
    if (key.startsWith('$') || key.includes('.')) continue;
    sanitized[key] = stripDangerousKeys(value);
  }
  return sanitized;
};

export const mongoSanitizeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = stripDangerousKeys(req.body);
  }
  if (req.params) {
    req.params = stripDangerousKeys(req.params) as Record<string, string>;
  }
  // Note: req.query is intentionally NOT sanitized here because Express 5
  // defines it as a read-only getter. Query params should be validated via Zod.
  next();
};
