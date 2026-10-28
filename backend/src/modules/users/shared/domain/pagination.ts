export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface PageRequest {
  page: number;
  limit: number;
}

export function paginate<T>(
  items: T[],
  total: number,
  request: PageRequest,
): Page<T> {
  return { items, total, page: request.page, limit: request.limit };
}
