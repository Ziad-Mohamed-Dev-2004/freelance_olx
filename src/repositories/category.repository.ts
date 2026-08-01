import Category from '../models/category.model';
import { ICategory } from '../interfaces/category.interface';
import { BaseRepository, IBaseRepository } from './base.repository';
import { CategoryQueryFilters } from '../types/category.types';
import { IPaginatedResult } from '../types/common.types';

export interface ICategoryRepository extends IBaseRepository<ICategory> {
  findBySlug(slug: string): Promise<ICategory | null>;
  checkSlugExists(slug: string, excludeId?: string): Promise<boolean>;
  findCategoriesWithFilters(filters: CategoryQueryFilters): Promise<IPaginatedResult<ICategory>>;
}

export class CategoryRepository extends BaseRepository<ICategory> implements ICategoryRepository {
  constructor() {
    super(Category);
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return this.findOne({ slug, isDeleted: false }, 'parentCategory');
  }

  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const filter: Record<string, any> = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return this.exists(filter);
  }

  async findCategoriesWithFilters(
    filters: CategoryQueryFilters,
  ): Promise<IPaginatedResult<ICategory>> {
    const filter: Record<string, any> = {
      isDeleted: filters.isDeleted !== undefined ? filters.isDeleted : false,
    };

    if (filters.search) {
      filter.name = { $regex: filters.search, $options: 'i' };
    }

    if (filters.isActive !== undefined) {
      filter.isActive = filters.isActive;
    }

    if (filters.parentCategory !== undefined) {
      filter.parentCategory =
        filters.parentCategory === 'null' || filters.parentCategory === null
          ? null
          : filters.parentCategory;
    }

    return this.findManyWithPagination(
      filter,
      { page: filters.page, limit: filters.limit, sort: filters.sort },
      'parentCategory',
    );
  }
}

export default new CategoryRepository();
