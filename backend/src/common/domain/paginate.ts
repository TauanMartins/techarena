import { Page, PageRequest } from './pagination-types.js';
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
