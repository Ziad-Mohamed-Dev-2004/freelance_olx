import favoriteRepository, { FavoriteRepository } from '../repositories/favorite.repository';
import propertyRepository from '../repositories/property.repository';
import { PropertyStatus } from '../interfaces/property.interface';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/AppError';
import blockService from './block.service';
import { PaginationQuery } from '../types/favorite.types';

export class FavoriteService {
  constructor(private readonly favoriteRepo: FavoriteRepository = favoriteRepository) {}
  async add(user: string, propertyId: string) {
    const property = await propertyRepository.findById(propertyId);
    if (!property || property.isDeleted || property.status !== PropertyStatus.ACTIVE)
      throw new NotFoundError('Property not found');
    if (await blockService.hasInteractionBlock(user, property.owner.toString()))
      throw new ForbiddenError('You cannot interact with this property');
    if (await this.favoriteRepo.exists({ user, property: propertyId }))
      throw new ConflictError('Property is already in favorites');
    try {
      return await this.favoriteRepo.create({ user: user as any, property: propertyId as any });
    } catch (error: any) {
      if (error?.code === 11000) throw new ConflictError('Property is already in favorites');
      throw error;
    }
  }
  async remove(user: string, propertyId: string) {
    if (!(await this.favoriteRepo.remove(user, propertyId)))
      throw new NotFoundError('Favorite not found');
  }
  getFavorites(user: string, query: PaginationQuery) {
    return this.favoriteRepo.findUserFavorites(user, query);
  }
  async check(user: string, property: string) {
    return {
      isFavorited: await this.favoriteRepo.exists({ user, property }),
      favoritesCount: await this.favoriteRepo.countByProperty(property),
    };
  }
}
export default new FavoriteService();
