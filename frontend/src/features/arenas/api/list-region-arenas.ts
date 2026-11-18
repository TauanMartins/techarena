import { api } from '../../../lib/api-client';
import type { Arena } from '../../../shared/types';

/** Fetch all pages from our API; this does not make Google Maps requests. */
export async function listRegionArenas(
  token: string,
  filters: {
    lat?: number;
    longitude?: number;
    radiusKm?: number;
    sportId?: string;
    search?: string;
  },
  signal: AbortSignal,
) {
  const items = new Map<string, Arena>();
  let nextPage = 1;
  let totalPages = 1;
  let total = 0;
  do {
    signal.throwIfAborted();
    const result = await api.listArenas(token, {
      ...filters,
      page: nextPage,
      limit: 50,
    });
    result.items.forEach((arena) => items.set(arena.id, arena));
    total = result.total;
    totalPages = result.totalPages;
    if (!result.hasNextPage || !result.items.length) break;
    nextPage++;
  } while (nextPage <= totalPages);
  return { items: [...items.values()], total, hasNextPage: false };
}
