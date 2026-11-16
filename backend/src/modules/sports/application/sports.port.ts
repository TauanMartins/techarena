import type { Page, PageRequest } from '../../../common/domain/pagination.js';
import type { SportItem, MaterialItem, SportsQuery } from '../domain/sport.js';
export const SPORTS_REPOSITORY = Symbol('SPORTS_REPOSITORY');
export interface SportsRepository {
  list(query: SportsQuery): Promise<Page<SportItem>>;
  forArena(arenaId: string, query: PageRequest): Promise<Page<SportItem>>;
  materials(sportId: string, query: PageRequest): Promise<Page<MaterialItem>>;
}
