import { IPaginationOptions } from './common.types';

export interface CreateAreaInput {
  city: string;
  name: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface UpdateAreaInput {
  city?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

export interface AreaQueryFilters extends IPaginationOptions {
  search?: string;
  city?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}
