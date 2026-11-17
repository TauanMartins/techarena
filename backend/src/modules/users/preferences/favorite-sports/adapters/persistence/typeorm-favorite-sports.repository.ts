import type { EntityManager } from 'typeorm';
import { DataSource, In } from 'typeorm';
import {
  Sport,
  User,
  UserSport,
} from '../../../../../../database/entities/index.js';
import { userDatabaseWrite } from '../../../../shared/persistence/database-errors.js';
import type {
  FavoriteSportsRepository,
  FavoriteSportsStore,
} from '../../application/ports/favorite-sports-repository.port.js';

export class TypeormFavoriteSportsRepository implements FavoriteSportsRepository {
  constructor(private readonly dataSource: DataSource) {}
  private async sports(manager: EntityManager, id: string) {
    const rows = await manager.getRepository(UserSport).find({
      where: { userId: id },
      relations: { sport: true },
      order: { sportId: 'ASC' },
    });
    return rows.map((row) => ({ id: row.sport.id, name: row.sport.name }));
  }
  getSports(id: string) {
    return this.sports(this.dataSource.manager, id);
  }
  transaction<T>(work: (store: FavoriteSportsStore) => Promise<T>): Promise<T> {
    return userDatabaseWrite(() =>
      this.dataSource.transaction((manager) =>
        work({
          lockOwner: async (id) =>
            Boolean(
              await manager.getRepository(User).findOne({
                where: { id },
                lock: { mode: 'pessimistic_write' },
              }),
            ),
          countSports: (ids) =>
            ids.length
              ? manager.getRepository(Sport).countBy({ id: In(ids) })
              : Promise.resolve(0),
          replace: async (id, ids) => {
            await manager.getRepository(UserSport).delete({ userId: id });
            if (ids.length)
              await manager
                .getRepository(UserSport)
                .insert(ids.map((sportId) => ({ userId: id, sportId })));
          },
          sports: (id) => this.sports(manager, id),
        }),
      ),
    );
  }
}
