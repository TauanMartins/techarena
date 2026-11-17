import { DataSource } from 'typeorm';
import { DomainError } from '../../../../common/domain/domain-error.js';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import { paginate } from '../../../../common/domain/pagination.js';
import {
  Arena,
  Sport,
  SportArena,
  SportMaterial,
} from '../../../../database/entities/index.js';
import type { SportsRepository } from '../../application/ports/sports.port.js';
import type { SportsQuery } from '../../domain/sport.js';
export class TypeormSportsRepository implements SportsRepository {
  constructor(private readonly source: DataSource) {}
  async list(query: SportsQuery) {
    const q = this.source.getRepository(Sport).createQueryBuilder('sport');
    if (query.search)
      q.where('sport.name ILIKE :search', {
        search: `%${query.search.replace(/[\\%_]/g, '\\$&')}%`,
      });
    const [rows, total] = await q
      .orderBy('sport.name')
      .addOrderBy('sport.id')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return paginate(
      rows.map((s) => ({
        id: s.id,
        name: s.name,
        defaultPlayers: s.defaultValuePlayerNumbers,
      })),
      total,
      query,
    );
  }
  async forArena(arenaId: string, query: PageRequest) {
    if (!(await this.source.getRepository(Arena).existsBy({ id: arenaId })))
      throw new DomainError('not_found', 'ARENA_NOT_FOUND', 'Arena not found');
    const [rows, total] = await this.source
      .getRepository(SportArena)
      .findAndCount({
        where: { arenaId },
        relations: { sport: true },
        order: { sportId: 'ASC' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    return paginate(
      rows.map((r) => ({
        id: r.sport.id,
        name: r.sport.name,
        defaultPlayers: r.sport.defaultValuePlayerNumbers,
      })),
      total,
      query,
    );
  }
  async participantMaterials(sportId: string, query: PageRequest) {
    if (!(await this.source.getRepository(Sport).existsBy({ id: sportId })))
      throw new DomainError('not_found', 'SPORT_NOT_FOUND', 'Sport not found');
    const [rows, total] = await this.source
      .getRepository(SportMaterial)
      .findAndCount({
        where: { sportId, relatedToLocal: false },
        relations: { material: true },
        order: { id: 'ASC' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    return paginate(
      rows.map((r) => ({
        id: r.material.id,
        description: r.material.description,
        relatedToLocal: r.relatedToLocal,
      })),
      total,
      query,
    );
  }
}
