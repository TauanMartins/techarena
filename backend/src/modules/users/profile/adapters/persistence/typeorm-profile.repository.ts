import { DataSource } from 'typeorm';

import { User } from '../../../../../database/entities/index.js';
import type { ProfileRepository } from '../../domain/profile-repository.port.js';
import { UserError } from '../../../shared/domain/user-error.js';
import { userDatabaseWrite } from '../../../shared/persistence/database-errors.js';

import type { ProfileChanges, UserProfile } from '../../domain/profile.js';

function profile(row: User): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    permission: row.permission?.slug ?? null,
    username: row.username,
    birthDate: row.dtBirth,
    gender: row.gender,
    image: row.image,
    createdAt: row.createdAt,
  };
}
export class TypeormProfileRepository implements ProfileRepository {
  constructor(private readonly dataSource: DataSource) {}
  exists(id: string) {
    return this.dataSource.getRepository(User).existsBy({ id });
  }
  async findBirthDate(id: string) {
    const row = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id }, select: { id: true, dtBirth: true } });
    return row ? { birthDate: row.dtBirth } : null;
  }
  async findById(id: string) {
    const row = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id }, relations: { permission: true } });
    return row ? profile(row) : null;
  }
  async update(id: string, changes: ProfileChanges) {
    return userDatabaseWrite(async () => {
      const { birthDate, ...fields } = changes;
      const repository = this.dataSource.getRepository(User);
      const result = await repository.update(id, {
        ...fields,
        ...(birthDate !== undefined ? { dtBirth: birthDate } : {}),
      });
      const row = result.affected
        ? await repository.findOne({
            where: { id },
            relations: { permission: true },
          })
        : null;
      if (!row)
        throw new UserError(
          'not_found',
          'PROFILE_NOT_FOUND',
          'Profile not found',
        );
      return profile(row);
    });
  }
}
