import { assertPageRequest } from '../../shared/domain/pagination.js';
import { UserError } from '../../shared/domain/user-error.js';
import type { DirectoryQuery } from '../domain/directory.js';
import type { DirectoryRepository } from './ports/directory-repository.port.js';
export class DirectoryApplication {
  constructor(private readonly repository: DirectoryRepository) {}
  search(query: DirectoryQuery) {
    assertPageRequest(query);
    const search = query.search.trim();
    if (
      search.length < 2 ||
      search.length > 100 ||
      !['all', 'username', 'name'].includes(query.searchBy) ||
      !['name', 'username'].includes(query.sortBy) ||
      !['asc', 'desc'].includes(query.sortOrder)
    ) {
      throw new UserError(
        'invalid',
        'INVALID_DIRECTORY_QUERY',
        'Invalid search or sorting options',
      );
    }
    return this.repository.search({ ...query, search });
  }
}
