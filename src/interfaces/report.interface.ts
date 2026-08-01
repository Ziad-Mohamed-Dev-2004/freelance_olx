import { Document, Types } from 'mongoose';
import { IUser } from './user.interface';
import { IProperty } from './property.interface';

export enum ReportReason {
  SPAM = 'Spam',
  FRAUD = 'Fraud',
  FAKE_LISTING = 'Fake Listing',
  DUPLICATE_LISTING = 'Duplicate Listing',
  HARASSMENT = 'Harassment',
  SCAM = 'Scam',
  OFFENSIVE_CONTENT = 'Offensive Content',
  OTHER = 'Other',
}
export enum ReportStatus {
  PENDING = 'Pending',
  UNDER_REVIEW = 'UnderReview',
  RESOLVED = 'Resolved',
  REJECTED = 'Rejected',
}

export interface IReport extends Document {
  reporter: Types.ObjectId | IUser;
  reportedUser?: Types.ObjectId | IUser;
  reportedProperty?: Types.ObjectId | IProperty;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  adminNote?: string;
  resolvedBy?: Types.ObjectId | IUser;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
