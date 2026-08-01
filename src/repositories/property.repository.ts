import Property from '../models/property.model';
import { IProperty } from '../interfaces/property.interface';
import { BaseRepository, IBaseRepository } from './base.repository';
import { PropertyPaginatedResult, PropertyQueryFilters } from '../types/property.types';
import PropertyView from '../models/property-view.model';

const populateProperty = [
  { path: 'owner', select: 'name email phone avatar' },
  { path: 'category', select: 'name slug' },
  { path: 'city', select: 'name slug governorate' },
  { path: 'area', select: 'name slug city' },
];

export interface IPropertyRepository extends IBaseRepository<IProperty> {
  findPropertiesWithFilters(filters: PropertyQueryFilters): Promise<PropertyPaginatedResult>;
  incrementViews(id: string): Promise<IProperty | null>;
  recordView(id: string): Promise<IProperty | null>;
}

export class PropertyRepository extends BaseRepository<IProperty> implements IPropertyRepository {
  constructor() {
    super(Property);
  }

  async findPropertiesWithFilters(filters: PropertyQueryFilters): Promise<PropertyPaginatedResult> {
    const filter: Record<string, any> = { isDeleted: filters.isDeleted ?? false };
    if (filters.search) {
      const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = ['title', 'description', 'address'].map((field) => ({
        [field]: { $regex: escaped, $options: 'i' },
      }));
    }
    for (const key of [
      'category',
      'city',
      'area',
      'owner',
      'rentType',
      'propertyType',
      'status',
    ] as const) {
      if (filters[key] !== undefined) filter[key] = filters[key];
    }
    if (filters.featured !== undefined) filter.featured = filters.featured;
    if (filters.bedrooms !== undefined) filter.bedrooms = filters.bedrooms;
    if (filters.bathrooms !== undefined) filter.bathrooms = filters.bathrooms;
    for (const key of [
      'furnished',
      'parking',
      'elevator',
      'balcony',
      'airConditioner',
      'internet',
    ] as const) {
      if (filters[key] !== undefined) filter[key] = filters[key];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filter.price = {};
      if (filters.minPrice !== undefined) filter.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) filter.price.$lte = filters.maxPrice;
    }
    const sortMap: Record<string, string> = {
      newest: 'createdAt:desc',
      oldest: 'createdAt:asc',
      lowestPrice: 'price:asc',
      highestPrice: 'price:desc',
      mostViewed: 'views:desc',
      mostRecent: 'publishedAt:desc',
    };
    const result = await this.findManyWithPagination(
      filter,
      { ...filters, sort: filters.sort ? sortMap[filters.sort] : undefined },
      populateProperty,
    );
    return {
      ...result,
      totalItems: result.total,
      hasNext: result.page < result.totalPages,
      hasPrevious: result.page > 1,
    };
  }

  async incrementViews(id: string): Promise<IProperty | null> {
    return Property.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
      .populate(populateProperty)
      .exec();
  }

  async recordView(id: string): Promise<IProperty | null> {
    const property = await this.incrementViews(id);
    if (property) await PropertyView.create({ property: id });
    return property;
  }
}

export { populateProperty };
export default new PropertyRepository();
