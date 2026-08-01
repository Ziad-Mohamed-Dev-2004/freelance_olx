import reportRepository, {
  ReportRepository,
  reportPopulate,
} from '../repositories/report.repository';
import propertyRepository from '../repositories/property.repository';
import User from '../models/user.model';
import { CreateReportInput, ReportQuery } from '../types/report.types';
import { ReportStatus } from '../interfaces/report.interface';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/AppError';

export class ReportService {
  constructor(private readonly reportRepo: ReportRepository = reportRepository) {}
  private async create(reporter: string, target: Record<string, string>, input: CreateReportInput) {
    if (await this.reportRepo.hasPendingReport(reporter, target))
      throw new ConflictError('A pending report for this target already exists');
    return this.reportRepo.create({
      reporter: reporter as any,
      ...target,
      ...input,
      status: ReportStatus.PENDING,
    } as any);
  }
  async reportProperty(reporter: string, propertyId: string, input: CreateReportInput) {
    const property = await propertyRepository.findById(propertyId);
    if (!property || property.isDeleted) throw new NotFoundError('Property not found');
    if (property.owner.toString() === reporter)
      throw new BadRequestError('You cannot report your own property');
    return this.create(reporter, { reportedProperty: propertyId }, input);
  }
  async reportUser(reporter: string, userId: string, input: CreateReportInput) {
    if (reporter === userId) throw new BadRequestError('You cannot report yourself');
    if (!(await User.exists({ _id: userId }))) throw new NotFoundError('User not found');
    return this.create(reporter, { reportedUser: userId }, input);
  }
  getMine(reporter: string, query: ReportQuery) {
    return this.reportRepo.findReports({ reporter }, query);
  }
  getAll(query: ReportQuery) {
    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.reason) filter.reason = query.reason;
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: escaped, $options: 'i' };
      filter.$or = [{ reason: regex }, { description: regex }, { adminNote: regex }];
    }
    return this.reportRepo.findReports(filter, query);
  }
  async getById(id: string) {
    const report = await this.reportRepo.findById(id, reportPopulate);
    if (!report) throw new NotFoundError('Report not found');
    return report;
  }
  async updateStatus(id: string, status: ReportStatus, adminId: string, adminNote?: string) {
    const report = await this.getById(id);
    const update: Record<string, any> = { status };
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status === ReportStatus.RESOLVED) {
      update.resolvedBy = adminId;
      update.resolvedAt = new Date();
    }
    if (report.status === status) throw new BadRequestError(`Report is already ${status}`);
    const updated = await this.reportRepo.updateById(id, update);
    if (!updated) throw new NotFoundError('Report not found');
    return updated;
  }
  resolve(id: string, adminId: string, adminNote?: string) {
    return this.updateStatus(id, ReportStatus.RESOLVED, adminId, adminNote);
  }
  reject(id: string, adminId: string, adminNote?: string) {
    return this.updateStatus(id, ReportStatus.REJECTED, adminId, adminNote);
  }
  async addAdminNote(id: string, adminNote: string) {
    await this.getById(id);
    const updated = await this.reportRepo.updateById(id, { adminNote });
    if (!updated) throw new NotFoundError('Report not found');
    return updated;
  }
  async remove(id: string) {
    if (!(await this.reportRepo.deleteById(id))) throw new NotFoundError('Report not found');
  }
}
export default new ReportService();
