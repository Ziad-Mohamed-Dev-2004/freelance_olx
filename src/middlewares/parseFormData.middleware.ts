import { Request, Response, NextFunction } from 'express';
import { normalizeCategoryBody, normalizePropertyBody } from '../utils/formData';

export const normalizeCategoryFormData = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  req.body = normalizeCategoryBody(req.body);
  next();
};

export const normalizePropertyFormData = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  req.body = normalizePropertyBody(req.body);
  next();
};
