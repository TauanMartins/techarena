import { DataSource, In } from 'typeorm';
import type { EntityManager } from 'typeorm';
import {
  Arena,
  Sport,
  SportArena,
} from '../../../../database/entities/index.js';
import { DomainError } from '../../../../common/domain/domain-error.js';
import { paginate } from '../../../../common/domain/pagination.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import {
  ARENA_DISTANCE_KM,
  escapeLike,
} from '../../../../common/persistence/queries.js';
import type {
  ArenaInput,
  ArenaQuery,
  ArenasRepository,
  ArenaView,
} from '../../domain/arenas.port.js';
function view(
  a: Arena,
  sportIds: string[],
  distanceKm: number | null = null,
): ArenaView {
  return {
    id: a.id,
    address: a.address,
    lat: Number(a.lat),
    longitude: Number(a.longitude),
    image: a.image,
    isLeagueOnly: a.isLeagueOnly,
    sportIds,
    distanceKm,
  };
}
export class TypeormArenasRepository implements ArenasRepository {
  constructor(private readonly source: DataSource) {}
  async list(query: ArenaQuery, admin: boolean) {
    const q = this.source.getRepository(Arena).createQueryBuilder('arena');
    if (!admin) q.where('arena.isLeagueOnly = false');
    if (query.search)
      q.andWhere('arena.address ILIKE :search', {
        search: `%${escapeLike(query.search)}%`,
      });
    if (query.sportId)
      q.andWhere(
        'EXISTS(SELECT 1 FROM public.sport_arena sa WHERE sa.arena_id=arena.id AND sa.sport_id=:sportId)',
        { sportId: query.sportId },
      );
    if (query.lat !== undefined) {
      q.addSelect(ARENA_DISTANCE_KM, 'distance_km').setParameters({
        lat: query.lat,
        longitude: query.longitude,
      });
      if (query.radiusKm !== undefined)
        q.andWhere(`${ARENA_DISTANCE_KM} <= :radius`, {
          radius: query.radiusKm,
        });
      q.orderBy('distance_km', 'ASC');
    }
    q.addOrderBy('arena.id', 'ASC');
    const total = await q.getCount();
    const { entities, raw } = await q
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getRawAndEntities();
    const links = entities.length
      ? await this.source
          .getRepository(SportArena)
          .findBy({ arenaId: In(entities.map((a) => a.id)) })
      : [];
    return paginate(
      entities.map((a, i) =>
        view(
          a,
          links.filter((l) => l.arenaId === a.id).map((l) => l.sportId),
          query.lat === undefined ? null : Number(raw[i].distance_km),
        ),
      ),
      total,
      query,
    );
  }
  private async persist(
    manager: EntityManager,
    input: ArenaInput,
    id?: string,
  ) {
    const arenas = manager.getRepository(Arena);
    if (
      id &&
      !(await arenas.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      }))
    )
      throw new DomainError('not_found', 'ARENA_NOT_FOUND', 'Arena not found');
    if (
      (await manager
        .getRepository(Sport)
        .countBy({ id: In(input.sportIds) })) !== input.sportIds.length
    )
      throw new DomainError(
        'not_found',
        'SPORT_NOT_FOUND',
        'One or more sports do not exist',
      );
    const row = await arenas.save(
      arenas.create({
        ...(id ? { id } : {}),
        address: input.address,
        lat: String(input.lat),
        longitude: String(input.longitude),
        image: input.image ?? null,
        isLeagueOnly: input.isLeagueOnly,
      }),
    );
    const links = manager.getRepository(SportArena);
    const existing = await links.findBy({ arenaId: row.id });
    const remove = existing.filter(
      (link) => !input.sportIds.includes(link.sportId),
    );
    if (remove.length)
      await links.delete({ id: In(remove.map((link) => link.id)) });
    const add = input.sportIds.filter(
      (sportId) => !existing.some((link) => link.sportId === sportId),
    );
    if (add.length)
      await links.insert(add.map((sportId) => ({ sportId, arenaId: row.id })));
    return view(await arenas.findOneByOrFail({ id: row.id }), input.sportIds);
  }
  create(input: ArenaInput) {
    return databaseWrite(() =>
      this.source.transaction((manager) => this.persist(manager, input)),
    );
  }
  update(id: string, input: ArenaInput) {
    return databaseWrite(() =>
      this.source.transaction((manager) => this.persist(manager, input, id)),
    );
  }
}
