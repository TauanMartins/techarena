import type { SportSummary } from './favorite-sports.js';

export const FAVORITE_SPORTS_REPOSITORY = Symbol('FAVORITE_SPORTS_REPOSITORY');
export interface FavoriteSportsRepository {
  getSports(id: string): Promise<SportSummary[]>;
  replaceSports(id: string, ids: string[]): Promise<SportSummary[]>;
}
