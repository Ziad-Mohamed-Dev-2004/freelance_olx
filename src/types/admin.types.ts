import { UserRole, UserStatus } from '../interfaces/user.interface';

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface AnalyticsQuery {
  period: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface PropertyViewsChartPoint {
  date: string;
  views: number;
}

export interface AnalyticsCharts {
  newUsers: ChartDataPoint[];
  newProperties: ChartDataPoint[];
  propertyViews: PropertyViewsChartPoint[];
  messages: ChartDataPoint[];
  reports: ChartDataPoint[];
  favorites: ChartDataPoint[];
}

export interface AnalyticsResult {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  charts: AnalyticsCharts;
}

export interface DashboardStats {
  totalUsers: number;
  totalActiveUsers: number;
  totalBlockedUsers: number;
  totalProperties: number;
  pendingProperties: number;
  approvedProperties: number;
  rejectedProperties: number;
  rentedProperties: number;
  archivedProperties: number;
  totalCategories: number;
  totalCities: number;
  totalAreas: number;
  totalConversations: number;
  totalMessages: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  totalFavorites: number;
  todayNewUsers: number;
  todayNewProperties: number;
  todayMessages: number;
}

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  verified?: 'true' | 'false';
  createdFrom?: string;
  createdTo?: string;
}

export interface UpdateAdminUserInput {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangeUserRoleInput {
  role: UserRole;
}

export interface ResetUserPasswordInput {
  password: string;
}

export interface UserDetailsStats {
  propertiesCount: number;
  favoritesCount: number;
  reportsCount: number;
  conversationsCount: number;
  messagesCount: number;
}

export interface AdminLogQuery {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
  search?: string;
  action?: string;
}
