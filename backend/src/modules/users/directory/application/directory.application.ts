import type { DirectoryRepository } from '../domain/directory-repository.port.js';

import type { PageRequest } from '../../shared/domain/pagination.js';

export class DirectoryApplication {
  constructor(private readonly repository: DirectoryRepository) {}
  search(search: string, pagination: PageRequest) {
    return this.repository.search(search, pagination);
  }
}
