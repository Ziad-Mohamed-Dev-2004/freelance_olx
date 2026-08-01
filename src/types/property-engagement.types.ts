export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest';
}
export interface SavedSearchInput {
  name: string;
  filters: Record<string, unknown>;
}
export interface SharePropertyInput {
  channel?: string;
}
