import AdminLog from '../models/admin-log.model';
import { IAdminLog } from '../interfaces/admin-log.interface';

export class AdminLogRepository {
  create(data: Partial<IAdminLog>) {
    return AdminLog.create(data);
  }
  async findWithFilters(query: {
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest';
    search?: string;
    action?: string;
  }) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const filter: Record<string, unknown> = {};
    if (query.action) filter.action = query.action;
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { action: { $regex: escaped, $options: 'i' } },
        { entityType: { $regex: escaped, $options: 'i' } },
        { ipAddress: { $regex: escaped, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      AdminLog.find(filter)
        .sort({ createdAt: query.sort === 'oldest' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('admin', 'name email avatar')
        .exec(),
      AdminLog.countDocuments(filter),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }
}

export default new AdminLogRepository();
