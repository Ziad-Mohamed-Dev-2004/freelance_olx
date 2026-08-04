import User from '../models/user.model';
import { IUser } from '../interfaces/user.interface';
import { AdminUserQuery } from '../types/admin.types';
import { IPaginatedResult } from '../types/common.types';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  async findByEmail(email: string, excludeId?: string): Promise<IUser | null> {
    const filter: Record<string, any> = { email: email.toLowerCase() };
    if (excludeId) filter._id = { $ne: excludeId };
    return User.findOne(filter).exec();
  }

  async findWithFilters(query: AdminUserQuery): Promise<IPaginatedResult<IUser>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;
    const filter = this.buildFilter(query);
    const sort = query.sort === 'oldest' ? { createdAt: 1 as const } : { createdAt: -1 as const };

    const [items, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      User.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async updateById(id: string, data: Record<string, any>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async setStatus(id: string, status: string): Promise<IUser | null> {
    return this.updateById(id, { status });
  }

  async setRole(id: string, role: string): Promise<IUser | null> {
    return this.updateById(id, { role });
  }

  async resetPassword(id: string, password: string): Promise<IUser | null> {
    const user = await User.findById(id);
    if (!user) return null;
    user.password = password;
    await user.save();
    return user;
  }

  async softDelete(id: string): Promise<IUser | null> {
    return this.updateById(id, { isDeleted: true, deletedAt: new Date() });
  }

  async hardDelete(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id).exec();
  }

  async restore(id: string): Promise<IUser | null> {
    return this.updateById(id, { isDeleted: false, deletedAt: null });
  }

  private buildFilter(query: AdminUserQuery): Record<string, any> {
    const filter: Record<string, any> = {};

    if (query.search) {
      const regex = { $regex: query.search, $options: 'i' };
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.verified === 'true') filter.isEmailVerified = true;
    if (query.verified === 'false') filter.isEmailVerified = false;

    if (query.createdFrom || query.createdTo) {
      filter.createdAt = {};
      if (query.createdFrom) filter.createdAt.$gte = new Date(`${query.createdFrom}T00:00:00.000Z`);
      if (query.createdTo) filter.createdAt.$lte = new Date(`${query.createdTo}T23:59:59.999Z`);
    }

    return filter;
  }
}

export default new UserRepository();
