import type { SportSummary } from '../../domain/favorite-sports.js';

export const FAVORITE_SPORTS_REPOSITORY = Symbol('FAVORITE_SPORTS_REPOSITORY');
export interface FavoriteSportsRepository {
  getSports(id: string): Promise<SportSummary[]>;
  transaction<T>(work: (store: FavoriteSportsStore) => Promise<T>): Promise<T>;
}

export interface FavoriteSportsStore {
  lockOwner(id: string): Promise<boolean>;
  countSports(ids: string[]): Promise<number>;
  replace(id: string, ids: string[]): Promise<void>;
  sports(id: string): Promise<SportSummary[]>;
}
