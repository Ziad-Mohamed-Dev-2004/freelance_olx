export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IBaseQueryFilters {
  search?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}
