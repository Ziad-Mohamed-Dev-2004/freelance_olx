import { IBaseQueryFilters, IPaginatedResult } from './common.types';
import { IProperty, PropertyStatus, RentType } from '../interfaces/property.interface';

export interface CreatePropertyInput {
  category: string;
  city: string;
  area: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  rentType: RentType;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  areaSize: number;
  furnished?: boolean;
  parking?: boolean;
  balcony?: boolean;
  elevator?: boolean;
  airConditioner?: boolean;
  internet?: boolean;
  kitchen?: boolean;
  latitude?: number;
  longitude?: number;
  address: string;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput> & { featured?: boolean };

export interface PropertyQueryFilters extends IBaseQueryFilters {
  isDeleted?: boolean;
  category?: string;
  city?: string;
  area?: string;
  owner?: string;
  status?: PropertyStatus;
  rentType?: RentType;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  parking?: boolean;
  elevator?: boolean;
  balcony?: boolean;
  airConditioner?: boolean;
  internet?: boolean;
  featured?: boolean;
  page: number;
  limit: number;
  sort?: string;
}

export interface PropertyPaginatedResult extends IPaginatedResult<IProperty> {
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
