import type { PageRequest, SortOrder } from '../../shared/domain/pagination.js';
export interface UserCard {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}
export interface DirectoryQuery extends PageRequest {
  search: string;
  searchBy: 'all' | 'username' | 'name';
  sortBy: 'username' | 'name';
  sortOrder: SortOrder;
}
