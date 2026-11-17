import { DataSource } from 'typeorm';

import {
  Preference,
  UserPreference,
} from '../../../../../../database/entities/index.js';
import type { ThemeRepository } from '../../application/ports/theme-repository.port.js';

import { userDatabaseWrite } from '../../../../shared/persistence/database-errors.js';

import type { Theme } from '../../domain/theme.js';

export class TypeormThemeRepository implements ThemeRepository {
  constructor(private readonly dataSource: DataSource) {}
  async getTheme(id: string): Promise<Theme> {
    const row = await this.dataSource
      .getRepository(UserPreference)
      .createQueryBuilder('setting')
      .innerJoinAndSelect('setting.preference', 'preference')
      .where('setting.userId = :id AND preference.descPreference = :name', {
        id,
        name: 'prefered_theme',
      })
      .getOne();
    const value =
      row?.value?.toLowerCase() ?? row?.preference.defaultValue?.toLowerCase();
    return value === 'light' || value === 'dark' ? value : 'system';
  }
  async setTheme(id: string, theme: Theme) {
    await userDatabaseWrite(() =>
      this.dataSource.transaction(async (manager) => {
        await manager
          .getRepository(Preference)
          .createQueryBuilder()
          .insert()
          .values({ descPreference: 'prefered_theme' })
          .orIgnore()
          .execute();
        const preference = await manager
          .getRepository(Preference)
          .findOneByOrFail({ descPreference: 'prefered_theme' });
        await manager
          .getRepository(UserPreference)
          .upsert({ userId: id, preferenceId: preference.id, value: theme }, [
            'userId',
            'preferenceId',
          ]);
      }),
    );
  }
}
