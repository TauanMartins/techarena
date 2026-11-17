import type { Arena, Page, Sport } from '../../shared/types';
import { apiRequest } from './api-request';
import { queryString } from './query-string';
export const catalogClient = {
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
