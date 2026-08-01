import { Document, Types } from 'mongoose';

export interface IReview extends Document {
  user: Types.ObjectId;
  property: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface ISavedSearch extends Document {
  user: Types.ObjectId;
  name: string;
  filters: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
export interface IRecentlyViewed extends Document {
  user: Types.ObjectId;
  property: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export interface IPropertyShare extends Document {
  user?: Types.ObjectId;
  property: Types.ObjectId;
  channel: string;
  createdAt: Date;
}
