import type { Page } from '../../../common/domain/pagination.js';
import type { ArenaQuery, ArenaInput, ArenaView } from '../domain/arena.js';
export const ARENAS_REPOSITORY = Symbol('ARENAS_REPOSITORY');
export interface ArenaTransaction {
  lock(id: string): Promise<boolean>;
  existingSports(id: string): Promise<string[]>;
  countSports(ids: string[]): Promise<number>;
  save(input: ArenaInput, id?: string): Promise<string>;
  removeSports(arenaId: string, sportIds: string[]): Promise<void>;
  addSports(arenaId: string, sportIds: string[]): Promise<void>;
  present(id: string, sportIds: string[]): Promise<ArenaView>;
}
export interface ArenasRepository {
  list(query: ArenaQuery, admin: boolean): Promise<Page<ArenaView>>;
  transaction<T>(work: (store: ArenaTransaction) => Promise<T>): Promise<T>;
}
