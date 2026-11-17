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
  listArenas: (token: string, sportId?: string) =>
    apiRequest<Page<Arena>>(
      `/arenas${queryString({ page: 1, limit: 50, sportId })}`,
      token,
    ),
};
