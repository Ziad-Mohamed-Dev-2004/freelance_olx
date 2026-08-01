import { Document, Types } from 'mongoose';

export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  PROPERTY_APPROVED = 'property_approved',
  PROPERTY_REJECTED = 'property_rejected',
  REPORT_UPDATE = 'report_update',
  SYSTEM = 'system',
}
export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
