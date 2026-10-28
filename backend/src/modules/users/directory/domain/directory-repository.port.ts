import type { UserCard } from './directory.js';
import type { Page, PageRequest } from '../../shared/domain/pagination.js';
export const DIRECTORY_REPOSITORY = Symbol('DIRECTORY_REPOSITORY');
export interface DirectoryRepository {
  search(search: string, pagination: PageRequest): Promise<Page<UserCard>>;
}
