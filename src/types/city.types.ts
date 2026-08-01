import { IPaginationOptions } from './common.types';

export interface CreateCityInput {
  name: string;
  governorate: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface UpdateCityInput {
  name?: string;
  governorate?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface CityQueryFilters extends IPaginationOptions {
  search?: string;
  governorate?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}
