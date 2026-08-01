import Report from '../models/report.model';
import { IReport, ReportStatus } from '../interfaces/report.interface';
import { BaseRepository } from './base.repository';
import { ReportQuery } from '../types/report.types';

export const reportPopulate = [
  { path: 'reporter', select: 'name email phone avatar' },
  { path: 'reportedUser', select: 'name email phone avatar' },
  { path: 'reportedProperty', select: 'title owner status isDeleted images' },
  { path: 'resolvedBy', select: 'name email avatar' },
];
export class ReportRepository extends BaseRepository<IReport> {
  constructor() {
    super(Report);
  }
  hasPendingReport(reporter: string, target: Record<string, string>): Promise<boolean> {
    return this.exists({
      reporter,
      ...target,
      status: { $in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
    });
  }
  findReports(filter: Record<string, any>, query: ReportQuery) {
    return this.findManyWithPagination(
      filter,
      {
        page: query.page,
        limit: query.limit,
        sort: query.sort === 'oldest' ? 'createdAt:asc' : 'createdAt:desc',
      },
      reportPopulate,
    );
  }
  deleteById(id: string): Promise<IReport | null> {
    return Report.findByIdAndDelete(id).exec();
  }
}
export default new ReportRepository();
