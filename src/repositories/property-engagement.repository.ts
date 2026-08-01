import {
  PropertyShare,
  RecentlyViewed,
  Review,
  SavedSearch,
} from '../models/property-engagement.model';
import { Types } from 'mongoose';
import { PaginationQuery } from '../types/property-engagement.types';

export class PropertyEngagementRepository {
  async reviews(property: string, query: PaginationQuery) {
    const page = Math.max(query.page ?? 1, 1),
      limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const [items, total] = await Promise.all([
      Review.find({ property })
        .sort({ createdAt: query.sort === 'oldest' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name avatar')
        .exec(),
      Review.countDocuments({ property }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }
  createReview(data: Record<string, unknown>) {
    return Review.create(data);
  }
  findReview(user: string, property: string) {
    return Review.findOne({ user, property }).exec();
  }
  findReviewById(id: string) {
    return Review.findById(id).exec();
  }
  updateReview(id: string, data: Record<string, unknown>) {
    return Review.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }
  deleteReview(id: string) {
    return Review.findByIdAndDelete(id).exec();
  }
  reviewSummary(property: string) {
    return Review.aggregate([
      { $match: { property: new Types.ObjectId(property) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]).exec();
  }
  createSavedSearch(data: Record<string, unknown>) {
    return SavedSearch.create(data);
  }
  savedSearches(user: string) {
    return SavedSearch.find({ user }).sort({ createdAt: -1 }).exec();
  }
  savedSearch(id: string, user: string) {
    return SavedSearch.findOne({ _id: id, user }).exec();
  }
  updateSavedSearch(id: string, user: string, data: Record<string, unknown>) {
    return SavedSearch.findOneAndUpdate({ _id: id, user }, data, {
      new: true,
      runValidators: true,
    }).exec();
  }
  deleteSavedSearch(id: string, user: string) {
    return SavedSearch.findOneAndDelete({ _id: id, user }).exec();
  }
  recordView(user: string, property: string) {
    return RecentlyViewed.findOneAndUpdate(
      { user, property },
      { $set: { updatedAt: new Date() }, $setOnInsert: { user, property } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();
  }
  recentViews(user: string, query: PaginationQuery) {
    const page = Math.max(query.page ?? 1, 1),
      limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    return RecentlyViewed.find({ user })
      .sort({ updatedAt: query.sort === 'oldest' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('property', 'title images price currency status')
      .exec();
  }
  share(data: Record<string, unknown>) {
    return PropertyShare.create(data);
  }
}
export default new PropertyEngagementRepository();
