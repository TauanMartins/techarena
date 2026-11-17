import type { Page } from '../../../shared/domain/pagination.js';
import type { DirectoryQuery, UserCard } from '../../domain/directory.js';
export const DIRECTORY_REPOSITORY = Symbol('DIRECTORY_REPOSITORY');
export interface DirectoryRepository {
  search(query: DirectoryQuery): Promise<Page<UserCard>>;
}
