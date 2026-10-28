import { DataSource } from 'typeorm';

import { User } from '../../../../../database/entities/index.js';
import type { DirectoryRepository } from '../../domain/directory-repository.port.js';

import { paginate } from '../../../shared/domain/pagination.js';
import type { PageRequest } from '../../../shared/domain/pagination.js';

export class TypeormDirectoryRepository implements DirectoryRepository {
  constructor(private readonly dataSource: DataSource) {}
  async search(search: string, request: PageRequest) {
    const escaped = search.replace(/[\\%_]/g, '\\$&');
    const [rows, total] = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.username', 'user.image'])
      .where('(user.username ILIKE :search OR user.name ILIKE :search)', {
        search: `%${escaped}%`,
      })
      .orderBy('user.username', 'ASC', 'NULLS LAST')
      .addOrderBy('user.id', 'ASC')
      .skip((request.page - 1) * request.limit)
      .take(request.limit)
      .getManyAndCount();
    return paginate(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        username: row.username,
        image: row.image,
      })),
      total,
      request,
    );
  }
}
