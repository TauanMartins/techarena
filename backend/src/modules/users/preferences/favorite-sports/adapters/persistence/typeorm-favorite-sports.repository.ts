import { DataSource, In } from 'typeorm';
import type { EntityManager } from 'typeorm';
import {
  Sport,
  User,
  UserSport,
} from '../../../../../../database/entities/index.js';
import type { FavoriteSportsRepository } from '../../domain/favorite-sports-repository.port.js';
import { UserError } from '../../../../shared/domain/user-error.js';
import { userDatabaseWrite } from '../../../../shared/persistence/database-errors.js';

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
  async replaceSports(id: string, sportIds: string[]) {
    return userDatabaseWrite(() =>
      this.dataSource.transaction(async (manager) => {
        const owner = await manager
          .getRepository(User)
          .findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
        if (!owner)
          throw new UserError(
            'not_found',
            'PROFILE_NOT_FOUND',
            'Profile not found',
          );
        const count = sportIds.length
          ? await manager.getRepository(Sport).countBy({ id: In(sportIds) })
          : 0;
        if (count !== sportIds.length)
          throw new UserError(
            'not_found',
            'SPORT_NOT_FOUND',
            'One or more sports do not exist',
          );
        await manager.getRepository(UserSport).delete({ userId: id });
        if (sportIds.length)
          await manager
            .getRepository(UserSport)
            .insert(sportIds.map((sportId) => ({ userId: id, sportId })));
        return this.sports(manager, id);
      }),
    );
  }
}
