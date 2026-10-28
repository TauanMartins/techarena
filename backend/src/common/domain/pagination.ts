import { DomainError } from './domain-error.js';
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
export function paginate<T>(
  items: T[],
  total: number,
  request: PageRequest,
): Page<T> {
  const totalPages = Math.ceil(total / request.limit);
  return {
    items,
    total,
    page: request.page,
    limit: request.limit,
    totalPages,
    hasNextPage: request.page < totalPages,
    hasPreviousPage: request.page > 1 && total > 0,
  };
}

export function assertPageRequest(
  query: PageRequest & { sortOrder?: SortOrder },
): void {
  if (
    !Number.isInteger(query.page) ||
    query.page < 1 ||
    query.page > 10000 ||
    !Number.isInteger(query.limit) ||
    query.limit < 1 ||
    query.limit > 50 ||
    (query.sortOrder !== undefined &&
      !['asc', 'desc'].includes(query.sortOrder))
  ) {
    throw new DomainError(
      'invalid',
      'INVALID_PAGINATION',
      'Invalid pagination or sorting options',
    );
  }
}
