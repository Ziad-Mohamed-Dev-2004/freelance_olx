import { ReportReason, ReportStatus } from '../interfaces/report.interface';
export interface CreateReportInput {
  reason: ReportReason;
  description?: string;
}
export interface ReportQuery {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
  search?: string;
  status?: ReportStatus;
  reason?: ReportReason;
}
