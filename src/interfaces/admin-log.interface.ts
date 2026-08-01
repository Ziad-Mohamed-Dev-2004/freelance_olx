import { Document, Types } from 'mongoose';

export interface IAdminLog extends Document {
  admin: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
