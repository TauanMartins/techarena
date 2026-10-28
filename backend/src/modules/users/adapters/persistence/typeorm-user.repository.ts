import { DataSource, In, QueryFailedError } from 'typeorm';
import type { EntityManager } from 'typeorm';
import {
  Appointment,
  Preference,
  Sport,
  User,
  UserAppointment,
  UserPreference,
  UserSport,
  UserTeam,
} from '../../../../database/entities/index.js';
import type { UserRepository } from '../../domain/user-repository.port.js';
import { assertAppointmentAdmission, UserError } from '../../domain/user.js';
import type {
  PageRequest,
  ProfileChanges,
  Theme,
  UserProfile,
} from '../../domain/user.js';

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
function pagination<T>(items: T[], total: number, request: PageRequest) {
  return { items, total, page: request.page, limit: request.limit };
}

export class TypeormUserRepository implements UserRepository {
  constructor(private readonly dataSource: DataSource) {}

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string }).code;
        if (code === '23505')
          throw new UserError(
            'conflict',
            'PROFILE_CONFLICT',
            'The username or email is already in use',
          );
        if (code === '23503')
          throw new UserError(
            'not_found',
            'REFERENCE_NOT_FOUND',
            'The referenced record no longer exists',
          );
      }
      throw error;
    }
  }
  async findById(id: string) {
    const row = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id }, relations: { permission: true } });
    return row ? profile(row) : null;
  }
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
    return pagination(
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
  async update(id: string, changes: ProfileChanges) {
    return this.write(async () => {
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
    await this.write(() =>
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
    return this.write(() =>
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
  async getTeams(id: string, request: PageRequest) {
    const [rows, total] = await this.dataSource
      .getRepository(UserTeam)
      .findAndCount({
        where: { userId: id },
        relations: { team: true },
        order: { id: 'ASC' },
        skip: (request.page - 1) * request.limit,
        take: request.limit,
      });
    return pagination(
      rows.map((row) => ({
        id: row.team.id,
        name: row.team.name,
        role: row.role,
      })),
      total,
      request,
    );
  }
  async getAppointments(id: string, request: PageRequest) {
    const [rows, total] = await this.dataSource
      .getRepository(UserAppointment)
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.appointment', 'appointment')
      .where('membership.userId = :id', { id })
      .andWhere('appointment.deletedAt IS NULL')
      .orderBy('appointment.scheduledAt', 'DESC')
      .addOrderBy('appointment.id', 'DESC')
      .skip((request.page - 1) * request.limit)
      .take(request.limit)
      .getManyAndCount();
    return pagination(
      rows.map((row) => ({
        id: row.appointment.id,
        title: row.appointment.title,
        scheduledAt: row.appointment.scheduledAt,
        status: row.appointment.status,
        holder: row.holder,
      })),
      total,
      request,
    );
  }
  async joinAppointment(
    id: string,
    appointmentId: string,
    holder: boolean,
    now: Date,
  ) {
    return this.write(() =>
      this.dataSource.transaction(async (manager) => {
        const appointment = await manager.getRepository(Appointment).findOne({
          where: { id: appointmentId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!appointment)
          throw new UserError(
            'not_found',
            'APPOINTMENT_NOT_FOUND',
            'Appointment not found',
          );
        const memberships = manager.getRepository(UserAppointment);
        assertAppointmentAdmission(
          {
            deleted: appointment.deletedAt !== null,
            status: appointment.status,
            scheduledAt: appointment.scheduledAt,
            maxPlayers: appointment.maxPlayers,
            alreadyParticipating: await memberships.existsBy({
              appointmentId,
              userId: id,
            }),
            startingPlayers: await memberships.countBy({
              appointmentId,
              holder: true,
            }),
          },
          holder,
          now,
        );
        await memberships.insert({ userId: id, appointmentId, holder });
        return {
          id: appointment.id,
          title: appointment.title,
          scheduledAt: appointment.scheduledAt,
          status: appointment.status,
          holder,
        };
      }),
    );
  }
}
