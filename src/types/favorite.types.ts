export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}
