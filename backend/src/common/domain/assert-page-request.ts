import { DomainError } from './domain-error.js';

import { PageRequest, SortOrder } from './pagination-types.js';
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
