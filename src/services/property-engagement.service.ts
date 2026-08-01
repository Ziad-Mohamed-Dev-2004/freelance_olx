import propertyRepository from '../repositories/property.repository';
import propertyEngagementRepository, {
  PropertyEngagementRepository,
} from '../repositories/property-engagement.repository';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/AppError';
import {
  PaginationQuery,
  SavedSearchInput,
  SharePropertyInput,
} from '../types/property-engagement.types';

export class PropertyEngagementService {
  constructor(private readonly repo: PropertyEngagementRepository = propertyEngagementRepository) {}
  private async property(id: string) {
    const property = await propertyRepository.findById(id);
    if (!property || property.isDeleted) throw new NotFoundError('Property not found');
    return property;
  }
  async addReview(user: string, propertyId: string, rating: number, comment?: string) {
    const property = await this.property(propertyId);
    if (property.owner.toString() === user)
      throw new ForbiddenError('You cannot review your own property');
    if (await this.repo.findReview(user, propertyId))
      throw new ConflictError('You have already reviewed this property');
    return this.repo.createReview({ user, property: propertyId, rating, comment });
  }
  async updateReview(user: string, id: string, rating?: number, comment?: string) {
    const existing = await this.repo.findReviewById(id);
    if (!existing) throw new NotFoundError('Review not found');
    if (existing.user.toString() !== user)
      throw new ForbiddenError('You cannot update this review');
    return this.repo.updateReview(id, {
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment }),
    });
  }
  async deleteReview(user: string, id: string) {
    const existing = await this.repo.findReviewById(id);
    if (!existing) throw new NotFoundError('Review not found');
    if (existing.user.toString() !== user)
      throw new ForbiddenError('You cannot delete this review');
    await this.repo.deleteReview(id);
  }
  async getReviews(property: string, query: PaginationQuery) {
    await this.property(property);
    const [reviews, summary] = await Promise.all([
      this.repo.reviews(property, query),
      this.repo.reviewSummary(property),
    ]);
    return {
      ...reviews,
      summary: summary[0]
        ? {
            averageRating: Number(summary[0].averageRating.toFixed(2)),
            totalReviews: summary[0].totalReviews,
          }
        : { averageRating: 0, totalReviews: 0 },
    };
  }
  createSavedSearch(user: string, input: SavedSearchInput) {
    return this.repo.createSavedSearch({ user, ...input });
  }
  getSavedSearches(user: string) {
    return this.repo.savedSearches(user);
  }
  async updateSavedSearch(user: string, id: string, input: Partial<SavedSearchInput>) {
    const updated = await this.repo.updateSavedSearch(id, user, input);
    if (!updated) throw new NotFoundError('Saved search not found');
    return updated;
  }
  async deleteSavedSearch(user: string, id: string) {
    if (!(await this.repo.deleteSavedSearch(id, user)))
      throw new NotFoundError('Saved search not found');
  }
  async recordRecentlyViewed(user: string, property: string) {
    await this.property(property);
    return this.repo.recordView(user, property);
  }
  getRecentlyViewed(user: string, query: PaginationQuery) {
    return this.repo.recentViews(user, query);
  }
  async shareProperty(
    user: string | undefined,
    property: string,
    input: SharePropertyInput,
    url: string,
  ) {
    await this.property(property);
    await this.repo.share({ user, property, channel: input.channel ?? 'copy_link' });
    return { shareUrl: url, channel: input.channel ?? 'copy_link' };
  }
}
export default new PropertyEngagementService();
