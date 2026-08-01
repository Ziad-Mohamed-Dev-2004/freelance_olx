import User from '../models/user.model';
import Property from '../models/property.model';
import Category from '../models/category.model';
import City from '../models/city.model';
import Area from '../models/area.model';
import Conversation from '../models/conversation.model';
import Message from '../models/message.model';
import Report from '../models/report.model';
import Favorite from '../models/favorite.model';
import PropertyView from '../models/property-view.model';
import { reportPopulate } from './report.repository';
import { Model, PipelineStage } from 'mongoose';
import { PropertyStatus } from '../interfaces/property.interface';
import { ReportStatus } from '../interfaces/report.interface';
import { UserStatus } from '../interfaces/user.interface';
import {
  AnalyticsPeriod,
  AnalyticsQuery,
  AnalyticsResult,
  ChartDataPoint,
  DashboardStats,
  PropertyViewsChartPoint,
} from '../types/admin.types';

interface DateRange {
  start: Date;
  end: Date;
}

interface TimeSeriesRow {
  _id: string;
  count?: number;
  views?: number;
}

export class AdminRepository {
  async getRecentActivity(limit = 10) {
    const take = Math.min(Math.max(limit, 1), 50);
    const [users, properties, reports, messages, favorites] = await Promise.all([
      User.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(take)
        .select('name email avatar role status createdAt')
        .exec(),
      Property.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(take)
        .populate('owner', 'name email avatar')
        .select('title status price currency images owner createdAt')
        .exec(),
      Report.find().sort({ createdAt: -1 }).limit(take).populate(reportPopulate).exec(),
      Message.find()
        .sort({ createdAt: -1 })
        .limit(take)
        .populate('sender', 'name avatar')
        .populate('conversation', 'property participants')
        .exec(),
      Favorite.find()
        .sort({ createdAt: -1 })
        .limit(take)
        .populate('user', 'name email avatar')
        .populate('property', 'title images status')
        .exec(),
    ]);
    return { users, properties, reports, messages, favorites };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalActiveUsers,
      totalBlockedUsers,
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      rentedProperties,
      archivedProperties,
      totalCategories,
      totalCities,
      totalAreas,
      totalConversations,
      totalMessages,
      totalReports,
      pendingReports,
      resolvedReports,
      totalFavorites,
      todayNewUsers,
      todayNewProperties,
      todayMessages,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      User.countDocuments({ status: UserStatus.ACTIVE, isDeleted: { $ne: true } }),
      User.countDocuments({ status: UserStatus.BLOCKED, isDeleted: { $ne: true } }),
      Property.countDocuments({ isDeleted: false }),
      Property.countDocuments({ status: PropertyStatus.PENDING, isDeleted: false }),
      Property.countDocuments({ status: PropertyStatus.ACTIVE, isDeleted: false }),
      Property.countDocuments({ status: PropertyStatus.REJECTED, isDeleted: false }),
      Property.countDocuments({ status: PropertyStatus.RENTED, isDeleted: false }),
      Property.countDocuments({ status: PropertyStatus.ARCHIVED, isDeleted: false }),
      Category.countDocuments({ isDeleted: false }),
      City.countDocuments({ isDeleted: false }),
      Area.countDocuments({ isDeleted: false }),
      Conversation.countDocuments(),
      Message.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: ReportStatus.PENDING }),
      Report.countDocuments({ status: ReportStatus.RESOLVED }),
      Favorite.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfToday }, isDeleted: { $ne: true } }),
      Property.countDocuments({ createdAt: { $gte: startOfToday }, isDeleted: false }),
      Message.countDocuments({ createdAt: { $gte: startOfToday } }),
    ]);

    return {
      totalUsers,
      totalActiveUsers,
      totalBlockedUsers,
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      rentedProperties,
      archivedProperties,
      totalCategories,
      totalCities,
      totalAreas,
      totalConversations,
      totalMessages,
      totalReports,
      pendingReports,
      resolvedReports,
      totalFavorites,
      todayNewUsers,
      todayNewProperties,
      todayMessages,
    };
  }

  async getAnalytics(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const range = this.resolveDateRange(query.period, query.startDate, query.endDate);
    const dateFormat = this.getDateFormat(query.period);

    const [newUsers, newProperties, propertyViews, messages, reports, favorites] =
      await Promise.all([
        this.aggregateTimeSeries(User, range, dateFormat),
        this.aggregateTimeSeries(Property, range, dateFormat, { isDeleted: false }),
        this.aggregatePropertyViews(range, dateFormat),
        this.aggregateTimeSeries(Message, range, dateFormat),
        this.aggregateTimeSeries(Report, range, dateFormat),
        this.aggregateTimeSeries(Favorite, range, dateFormat),
      ]);

    return {
      period: query.period,
      startDate: range.start.toISOString().split('T')[0],
      endDate: range.end.toISOString().split('T')[0],
      charts: { newUsers, newProperties, propertyViews, messages, reports, favorites },
    };
  }

  async getUserStats(userId: string) {
    const [propertiesCount, favoritesCount, reportsCount, conversationsCount, messagesCount] =
      await Promise.all([
        Property.countDocuments({ owner: userId, isDeleted: false }),
        Favorite.countDocuments({ user: userId }),
        Report.countDocuments({ $or: [{ reporter: userId }, { reportedUser: userId }] }),
        Conversation.countDocuments({ participants: userId }),
        Message.countDocuments({ sender: userId }),
      ]);

    return { propertiesCount, favoritesCount, reportsCount, conversationsCount, messagesCount };
  }

  private resolveDateRange(
    period: AnalyticsPeriod,
    startDate?: string,
    endDate?: string,
  ): DateRange {
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);

    switch (period) {
      case 'daily':
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7 * 11);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 11);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'yearly':
        start.setFullYear(start.getFullYear() - 4);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        return {
          start: new Date(`${startDate!}T00:00:00.000Z`),
          end: new Date(`${endDate!}T23:59:59.999Z`),
        };
      default:
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }

  private getDateFormat(period: AnalyticsPeriod): string {
    switch (period) {
      case 'weekly':
        return '%Y-W%V';
      case 'monthly':
        return '%Y-%m';
      case 'yearly':
        return '%Y';
      default:
        return '%Y-%m-%d';
    }
  }

  private async aggregateTimeSeries(
    model: Model<any>,
    range: DateRange,
    dateFormat: string,
    extraMatch: Record<string, unknown> = {},
  ): Promise<ChartDataPoint[]> {
    const pipeline: PipelineStage[] = [
      { $match: { createdAt: { $gte: range.start, $lte: range.end }, ...extraMatch } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];
    const rows = await model.aggregate<TimeSeriesRow>(pipeline).exec();

    return rows.map((row) => ({ date: row._id, count: row.count || 0 }));
  }

  private async aggregatePropertyViews(
    range: DateRange,
    dateFormat: string,
  ): Promise<PropertyViewsChartPoint[]> {
    const rows = await PropertyView.aggregate([
      { $match: { createdAt: { $gte: range.start, $lte: range.end } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).exec();

    return rows.map((row) => ({ date: row._id, views: row.views || 0 }));
  }
}

export default new AdminRepository();
