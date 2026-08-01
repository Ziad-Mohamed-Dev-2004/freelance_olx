import { Schema, model } from 'mongoose';
import { IReport, ReportReason, ReportStatus } from '../interfaces/report.interface';

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reportedProperty: { type: Schema.Types.ObjectId, ref: 'Property', default: null },
    reason: { type: String, enum: Object.values(ReportReason), required: true },
    description: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.PENDING },
    adminNote: { type: String, trim: true, maxlength: 2000 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
reportSchema.index({ reporter: 1, reportedUser: 1, status: 1 });
reportSchema.index({ reporter: 1, reportedProperty: 1, status: 1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ reportedProperty: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reason: 1 });
export default model<IReport>('Report', reportSchema);
