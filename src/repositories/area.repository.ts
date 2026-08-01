import Area from '../models/area.model';
import { IArea } from '../interfaces/area.interface';
import { BaseRepository, IBaseRepository } from './base.repository';
import { AreaQueryFilters } from '../types/area.types';
import { IPaginatedResult } from '../types/common.types';

export interface IAreaRepository extends IBaseRepository<IArea> {
  findBySlug(slug: string): Promise<IArea | null>;
  checkSlugExists(slug: string, excludeId?: string): Promise<boolean>;
  findAreasWithFilters(filters: AreaQueryFilters): Promise<IPaginatedResult<IArea>>;
}

export class AreaRepository extends BaseRepository<IArea> implements IAreaRepository {
  constructor() {
    super(Area);
  }

  async findBySlug(slug: string): Promise<IArea | null> {
    return this.findOne({ slug, isDeleted: false }, 'city');
  }

  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, any> = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return this.exists(filter);
  }

  async findAreasWithFilters(filters: AreaQueryFilters): Promise<IPaginatedResult<IArea>> {
    const filter: Record<string, any> = {
      isDeleted: filters.isDeleted !== undefined ? filters.isDeleted : false,
    };

    if (filters.search) {
      filter.name = { $regex: filters.search, $options: 'i' };
    }

    if (filters.city) {
      filter.city = filters.city;
    }

    if (filters.isActive !== undefined) {
      filter.isActive = filters.isActive;
    }

    return this.findManyWithPagination(
      filter,
      { page: filters.page, limit: filters.limit, sort: filters.sort },
      'city',
    );
  }
}

export default new AreaRepository();
