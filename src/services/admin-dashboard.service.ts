import adminRepository, { AdminRepository } from '../repositories/admin.repository';
import { AnalyticsQuery } from '../types/admin.types';

export class AdminDashboardService {
  constructor(private readonly adminRepo: AdminRepository = adminRepository) {}

  getDashboardStats() {
    return this.adminRepo.getDashboardStats();
  }

  getAnalytics(query: AnalyticsQuery) {
    return this.adminRepo.getAnalytics(query);
  }

  getRecentActivity(limit?: number) {
    return this.adminRepo.getRecentActivity(limit);
  }
}

export default new AdminDashboardService();
