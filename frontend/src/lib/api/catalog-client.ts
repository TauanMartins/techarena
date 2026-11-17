import type { Arena, Page, Sport } from '../../shared/types';
import { apiRequest } from './api-request';
import { queryString } from './query-string';
export const catalogClient = {
  getSportMaterials: (token: string, sportId: string, page = 1) =>
    apiRequest<
      Page<{ id: string; description: string; relatedToLocal: boolean }>
    >(`/sports/material${queryString({ sportId, page, limit: 50 })}`, token),
  getSports: (token: string, search?: string) =>
    apiRequest<Page<Sport>>(
      `/sports${queryString({ page: 1, limit: 50, search })}`,
      token,
    ),
  listArenas: (
    token: string,
    filters?:
      | string
      | {
          page?: number;
          limit?: number;
          sportId?: string;
          arenaId?: string;
          search?: string;
          lat?: number;
          longitude?: number;
          radiusKm?: number;
        },
  ) =>
    apiRequest<Page<Arena>>(
      `/arenas${queryString({ page: 1, limit: 50, ...(typeof filters === 'string' ? { sportId: filters } : filters) })}`,
      token,
    ),
};
