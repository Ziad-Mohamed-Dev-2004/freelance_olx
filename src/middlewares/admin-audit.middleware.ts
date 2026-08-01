import { Request, Response, NextFunction } from 'express';
import adminLogService from '../services/admin-log.service';

export const auditAdminAction =
  (action: string, entityType: string) => (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 400 || !req.user) return;
      void adminLogService.create({
        admin: req.user._id.toString(),
        action,
        entityType,
        entityId: typeof req.params.id === 'string' ? req.params.id : undefined,
        metadata: { method: req.method, path: req.originalUrl },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    });
    next();
  };
