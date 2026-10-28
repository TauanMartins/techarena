import type { Page, PageRequest } from '../../../common/domain/pagination.js';
export interface SportItem {
  id: string;
  name: string;
  defaultPlayers: number;
}
export interface MaterialItem {
  id: string;
  description: string;
  relatedToLocal: boolean;
}
export interface SportsQuery extends PageRequest {
  search?: string;
}
export const SPORTS_REPOSITORY = Symbol('SPORTS_REPOSITORY');
export interface SportsRepository {
  list(query: SportsQuery): Promise<Page<SportItem>>;
  forArena(arenaId: string, query: PageRequest): Promise<Page<SportItem>>;
  materials(sportId: string, query: PageRequest): Promise<Page<MaterialItem>>;
}
