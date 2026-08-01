import { Schema, model } from 'mongoose';
import {
  IPropertyShare,
  IRecentlyViewed,
  IReview,
  ISavedSearch,
} from '../interfaces/property-engagement.interface';

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);
reviewSchema.index({ user: 1, property: 1 }, { unique: true });
reviewSchema.index({ property: 1, createdAt: -1 });
const savedSearchSchema = new Schema<ISavedSearch>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    filters: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true },
);
savedSearchSchema.index({ user: 1, createdAt: -1 });
const recentlyViewedSchema = new Schema<IRecentlyViewed>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  { timestamps: true },
);
recentlyViewedSchema.index({ user: 1, property: 1 }, { unique: true });
recentlyViewedSchema.index({ user: 1, updatedAt: -1 });
const propertyShareSchema = new Schema<IPropertyShare>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    channel: { type: String, default: 'copy_link', maxlength: 50 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
propertyShareSchema.index({ property: 1, createdAt: -1 });
export const Review = model<IReview>('Review', reviewSchema);
export const SavedSearch = model<ISavedSearch>('SavedSearch', savedSearchSchema);
export const RecentlyViewed = model<IRecentlyViewed>('RecentlyViewed', recentlyViewedSchema);
export const PropertyShare = model<IPropertyShare>('PropertyShare', propertyShareSchema);
