import Favorite from '../models/favorite.model';
import { IFavorite } from '../interfaces/favorite.interface';
import { BaseRepository } from './base.repository';
import { PaginationQuery } from '../types/favorite.types';

const propertyPopulate = {
  path: 'property',
  match: { isDeleted: false, status: 'Active' },
  populate: [
    { path: 'owner', select: 'name email phone avatar' },
    { path: 'category', select: 'name slug' },
    { path: 'city', select: 'name slug governorate' },
    { path: 'area', select: 'name slug city' },
  ],
};
export class FavoriteRepository extends BaseRepository<IFavorite> {
  constructor() {
    super(Favorite);
  }
  async findUserFavorites(user: string, query: PaginationQuery) {
    const page = Math.max(1, query.page || 1),
      limit = Math.max(1, Math.min(100, query.limit || 10));
    const docs = await Favorite.find({ user })
      .sort({ createdAt: query.sort === 'oldest' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(propertyPopulate)
      .exec();
    const items = docs.filter((favorite) => favorite.property);
    const visibleFavorites = await Favorite.find({ user })
      .populate(propertyPopulate)
      .select('property')
      .exec();
    const total = visibleFavorites.filter((favorite) => favorite.property).length;
    const counted = await Promise.all(
      items.map(async (favorite) => ({
        ...favorite.toObject(),
        favoritesCount: await Favorite.countDocuments({ property: favorite.property }),
      })),
    );
    return { items: counted, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }
  remove(user: string, property: string): Promise<IFavorite | null> {
    return Favorite.findOneAndDelete({ user, property }).exec();
  }
  countByProperty(property: string): Promise<number> {
    return Favorite.countDocuments({ property });
  }
}
export default new FavoriteRepository();
