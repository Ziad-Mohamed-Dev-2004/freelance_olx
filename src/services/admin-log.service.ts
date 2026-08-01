import adminLogRepository, { AdminLogRepository } from '../repositories/admin-log.repository';
import { AdminLogQuery } from '../types/admin.types';

export interface CreateAdminLogInput {
  admin: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AdminLogService {
  constructor(private readonly adminLogRepo: AdminLogRepository = adminLogRepository) {}
  create(input: CreateAdminLogInput) {
    return this.adminLogRepo.create({ ...input, metadata: input.metadata ?? {} } as any);
  }
  getAll(query: AdminLogQuery) {
    return this.adminLogRepo.findWithFilters(query);
  }
}

export default new AdminLogService();
