export interface PageRequest {
  page: number;
  limit: number;
}
export type SortOrder = 'asc' | 'desc';
export interface Page<T> extends PageRequest {
  items: T[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
