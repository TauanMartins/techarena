import type { GeoFilter } from '../../../common/domain/geo.js';
import type { Page, PageRequest } from '../../../common/domain/pagination.js';
export interface ArenaQuery extends PageRequest, GeoFilter {
  search?: string;
  sportId?: string;
}
export interface ArenaInput {
  address: string;
  lat: number;
  longitude: number;
  image?: string | null;
  isLeagueOnly: boolean;
  sportIds: string[];
}
export interface ArenaView {
  id: string;
  address: string;
  lat: number;
  longitude: number;
  image: string | null;
  isLeagueOnly: boolean;
  sportIds: string[];
  distanceKm: number | null;
}
export const ARENAS_REPOSITORY = Symbol('ARENAS_REPOSITORY');
export interface ArenasRepository {
  list(query: ArenaQuery, admin: boolean): Promise<Page<ArenaView>>;
  create(input: ArenaInput): Promise<ArenaView>;
  update(id: string, input: ArenaInput): Promise<ArenaView>;
}
