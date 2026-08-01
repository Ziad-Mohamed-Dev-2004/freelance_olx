import { IPaginationOptions } from './common.types';

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  image?: string;
  parentCategory?: string | null;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  image?: string;
  parentCategory?: string | null;
  isActive?: boolean;
}

export interface CategoryQueryFilters extends IPaginationOptions {
  search?: string;
  isActive?: boolean;
  parentCategory?: string | null;
  isDeleted?: boolean;
}
