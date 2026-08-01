import City from '../models/city.model';
import { ICity } from '../interfaces/city.interface';
import { BaseRepository, IBaseRepository } from './base.repository';
import { CityQueryFilters } from '../types/city.types';
import { IPaginatedResult } from '../types/common.types';

export interface ICityRepository extends IBaseRepository<ICity> {
  findByName(name: string): Promise<ICity | null>;
  findBySlug(slug: string): Promise<ICity | null>;
  checkNameExists(name: string, excludeId?: string): Promise<boolean>;
  checkSlugExists(slug: string, excludeId?: string): Promise<boolean>;
  findCitiesWithFilters(filters: CityQueryFilters): Promise<IPaginatedResult<ICity>>;
}

export class CityRepository extends BaseRepository<ICity> implements ICityRepository {
  constructor() {
    super(City);
  }

  async findByName(name: string): Promise<ICity | null> {
    return this.findOne({ name, isDeleted: false });
  }

  async findBySlug(slug: string): Promise<ICity | null> {
    return this.findOne({ slug, isDeleted: false });
  }

  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, any> = { name };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return this.exists(filter);
  }

  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, any> = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return this.exists(filter);
  }

  async findCitiesWithFilters(filters: CityQueryFilters): Promise<IPaginatedResult<ICity>> {
    const filter: Record<string, any> = {
      isDeleted: filters.isDeleted !== undefined ? filters.isDeleted : false,
    };

    if (filters.search) {
      filter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { governorate: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.governorate) {
      filter.governorate = { $regex: filters.governorate, $options: 'i' };
    }

    if (filters.isActive !== undefined) {
      filter.isActive = filters.isActive;
    }

    return this.findManyWithPagination(filter, {
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
    });
  }
}

export default new CityRepository();
