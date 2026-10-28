import type { UserCard, DirectoryQuery } from './directory.js';
import type { Page } from '../../shared/domain/pagination.js';
export const DIRECTORY_REPOSITORY = Symbol('DIRECTORY_REPOSITORY');
export interface DirectoryRepository {
  search(query: DirectoryQuery): Promise<Page<UserCard>>;
}
