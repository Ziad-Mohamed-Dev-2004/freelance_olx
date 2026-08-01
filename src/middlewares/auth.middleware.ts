import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import User from '../models/user.model';
import { IUser, UserStatus } from '../interfaces/user.interface';
import { UnauthorizedError, ForbiddenError } from '../utils/AppError';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Verifies the Bearer JWT in the Authorization header and attaches the
 * full user document to req.user. Throws UnauthorizedError on failure.
 */
export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Please authenticate');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.secret) as { sub: string };

    const user = await User.findById(payload.sub);
    if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Please authenticate');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError('Please authenticate'));
  }
};

/** Attaches a user for public endpoints when a valid bearer token is supplied. */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  try {
    const payload = jwt.verify(authHeader.split(' ')[1], config.jwt.secret) as { sub: string };
    const user = await User.findById(payload.sub);
    if (user && !user.isDeleted && user.status === UserStatus.ACTIVE) req.user = user;
  } catch {
    // A public endpoint must remain available when an optional token is expired or malformed.
  }
  next();
};

/**
 * Role-based authorization guard. Use after the `auth` middleware.
 * Example: router.delete('/admin/users', auth, authorize('admin'), controller)
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
};
