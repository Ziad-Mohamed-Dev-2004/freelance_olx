export interface BlockQuery {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}
