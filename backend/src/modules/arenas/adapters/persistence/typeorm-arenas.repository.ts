import { DataSource, In } from 'typeorm';
import { paginate } from '../../../../common/domain/pagination.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import {
  ARENA_DISTANCE_KM,
  escapeLike,
} from '../../../../common/persistence/queries.js';
import {
  Arena,
  Sport,
  SportArena,
} from '../../../../database/entities/index.js';
import type {
  ArenasRepository,
  ArenaTransaction,
} from '../../application/ports/arenas.port.js';
import type { ArenaQuery, ArenaView } from '../../domain/arena.js';
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
    if (query.arenaId)
      q.andWhere('arena.id = :arenaId', { arenaId: query.arenaId });
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
  transaction<T>(work: (store: ArenaTransaction) => Promise<T>): Promise<T> {
    return databaseWrite(() =>
      this.source.transaction((m) =>
        work({
          lock: async (id) =>
            Boolean(
              await m.getRepository(Arena).findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
              }),
            ),
          existingSports: async (arenaId) =>
            (await m.getRepository(SportArena).findBy({ arenaId })).map(
              (row) => row.sportId,
            ),
          countSports: (ids) => m.getRepository(Sport).countBy({ id: In(ids) }),
          save: async (input, id) =>
            (
              await m.getRepository(Arena).save({
                ...(id ? { id } : {}),
                address: input.address,
                lat: String(input.lat),
                longitude: String(input.longitude),
                image: input.image ?? null,
                isLeagueOnly: input.isLeagueOnly,
              })
            ).id,
          removeSports: async (arenaId, sportIds) => {
            await m
              .getRepository(SportArena)
              .delete({ arenaId, sportId: In(sportIds) });
          },
          addSports: async (arenaId, sportIds) => {
            await m
              .getRepository(SportArena)
              .insert(sportIds.map((sportId) => ({ arenaId, sportId })));
          },
          present: async (id, sportIds) =>
            view(
              await m.getRepository(Arena).findOneByOrFail({ id }),
              sportIds,
            ),
        }),
      ),
    );
  }
}
