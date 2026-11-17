import { DataSource } from 'typeorm';
import { User } from '../../../../../database/entities/index.js';
import { paginate } from '../../../shared/domain/pagination.js';
import type { DirectoryRepository } from '../../application/ports/directory-repository.port.js';
import type { DirectoryQuery } from '../../domain/directory.js';
export class TypeormDirectoryRepository implements DirectoryRepository {
  constructor(private readonly dataSource: DataSource) {}
  async search(query: DirectoryQuery) {
    const escaped = query.search.replace(/[\\%_]/g, '\\$&');
    const builder = this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.username', 'user.image']);
    const fields = {
      all: '(user.username ILIKE :search OR user.name ILIKE :search)',
      name: 'user.name ILIKE :search',
      username: 'user.username ILIKE :search',
    };
    const columns = { name: 'user.name', username: 'user.username' };
    const order = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    builder
      .where(fields[query.searchBy], { search: `%${escaped}%` })
      .orderBy(columns[query.sortBy], order, 'NULLS LAST')
      .addOrderBy('user.id', order)
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [rows, total] = await builder.getManyAndCount();
    return paginate(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        username: row.username,
        image: row.image,
      })),
      total,
      query,
    );
  }
}
