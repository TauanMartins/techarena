import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';
import {
  Appointment,
  Arena,
  Schedule,
  Sport,
  SportArena,
  UserAppointment,
} from '../../../../database/entities/index.js';
import { DomainError } from '../../../../common/domain/domain-error.js';
import { paginate } from '../../../../common/domain/pagination.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import { ARENA_DISTANCE_KM } from '../../../../common/persistence/queries.js';
import type {
  AppointmentQuery,
  AppointmentsRepository,
  AvailabilityQuery,
  BookingCard,
  CreateAppointment,
} from '../../domain/appointments.port.js';
import { assertFutureSlot } from '../../domain/booking-policy.js';
function card(
  a: Appointment,
  actor: string,
  players: number,
  startingPlayers: number,
  isInside: boolean,
  distanceKm: number | null,
): BookingCard {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    scheduledAt: a.scheduledAt,
    status: a.status,
    organizerId: a.organizerId,
    arenaId: a.arenaId,
    sportId: a.sportId,
    scheduleId: a.scheduleId,
    arenaAddress: a.arena?.address ?? null,
    arenaImage: a.arena?.image ?? null,
    sportName: a.sport?.name ?? null,
    maxPlayers: a.maxPlayers,
    players,
    startingPlayers,
    isInside,
    distanceKm,
  };
}
export class TypeormAppointmentsRepository implements AppointmentsRepository {
  constructor(private readonly source: DataSource) {}
  async list(actor: string, query: AppointmentQuery, mine: boolean) {
    const q = this.source
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.arena', 'arena')
      .leftJoinAndSelect('appointment.sport', 'sport')
      .where('appointment.deletedAt IS NULL')
      .addSelect(
        '(SELECT count(*)::int FROM public.user_appointment ua WHERE ua.appointment_id=appointment.id)',
        'players',
      )
      .addSelect(
        '(SELECT count(*)::int FROM public.user_appointment ua WHERE ua.appointment_id=appointment.id AND ua.holder=true)',
        'starting_players',
      )
      .addSelect(
        'EXISTS(SELECT 1 FROM public.user_appointment ua WHERE ua.appointment_id=appointment.id AND ua.user_id=:actor)',
        'is_inside',
      )
      .setParameter('actor', actor);
    if (mine)
      q.andWhere(
        'EXISTS(SELECT 1 FROM public.user_appointment ua WHERE ua.appointment_id=appointment.id AND ua.user_id=:actor)',
      );
    else
      q.andWhere(
        "appointment.status='scheduled' AND appointment.scheduledAt > CURRENT_TIMESTAMP",
      );
    if (query.sportId)
      q.andWhere('appointment.sportId=:sportId', { sportId: query.sportId });
    if (query.arenaId)
      q.andWhere('appointment.arenaId=:arenaId', { arenaId: query.arenaId });
    if (query.preferSports)
      q.addSelect(
        'CASE WHEN EXISTS(SELECT 1 FROM public.user_sport us WHERE us.user_id=:actor AND us.sport_id=appointment.sport_id) THEN 1 ELSE 0 END',
        'preference_score',
      ).orderBy('preference_score', 'DESC');
    if (query.lat !== undefined) {
      q.addSelect(ARENA_DISTANCE_KM, 'distance_km').setParameters({
        lat: query.lat,
        longitude: query.longitude,
      });
      if (query.radiusKm !== undefined)
        q.andWhere(`${ARENA_DISTANCE_KM}<=:radius`, { radius: query.radiusKm });
      q.addOrderBy(
        'distance_km',
        query.distance === 'far' ? 'DESC' : 'ASC',
        'NULLS LAST',
      );
    }
    q.addOrderBy(
      'appointment.scheduledAt',
      query.orderByTime === 'future' ? 'DESC' : 'ASC',
    ).addOrderBy('appointment.id', 'ASC');
    const total = await q.getCount();
    const result = await q
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getRawAndEntities();
    return paginate(
      result.entities.map((a, i) =>
        card(
          a,
          actor,
          Number(result.raw[i].players),
          Number(result.raw[i].starting_players),
          Boolean(result.raw[i].is_inside),
          result.raw[i].distance_km == null
            ? null
            : Number(result.raw[i].distance_km),
        ),
      ),
      total,
      query,
    );
  }
  private async validateLink(manager: EntityManager, query: AvailabilityQuery) {
    const arena = await manager
      .getRepository(Arena)
      .findOneBy({ id: query.arenaId });
    if (!arena)
      throw new DomainError('not_found', 'ARENA_NOT_FOUND', 'Arena not found');
    if (arena.isLeagueOnly)
      throw new DomainError(
        'forbidden',
        'LEAGUE_ARENA',
        'This arena is restricted to league scheduling',
      );
    if (
      !(await manager
        .getRepository(SportArena)
        .existsBy({ arenaId: query.arenaId, sportId: query.sportId }))
    )
      throw new DomainError(
        'not_found',
        'SPORT_ARENA_NOT_FOUND',
        'This arena does not support the sport',
      );
    return arena;
  }
  async available(query: AvailabilityQuery, now: Date) {
    await this.validateLink(this.source.manager, query);
    const rows = await this.source
      .getRepository(Schedule)
      .createQueryBuilder('schedule')
      .where(
        "((CAST(:date AS date) + schedule.horary) AT TIME ZONE 'UTC') > :now",
        {
          date: query.date,
          now,
        },
      )
      .andWhere(
        `NOT EXISTS(SELECT 1 FROM public.appointment a WHERE a.arena_id=:arenaId AND a.scheduled_at=((CAST(:date AS date)+schedule.horary) AT TIME ZONE 'UTC') AND a.deleted_at IS NULL AND a.status IN ('scheduled','in_progress'))`,
        { arenaId: query.arenaId },
      )
      .orderBy('schedule.horary', 'ASC')
      .getMany();
    return rows.map((s) => ({ id: s.id, horary: s.horary }));
  }
  async create(actor: string, input: CreateAppointment, clock: () => Date) {
    return databaseWrite(() =>
      this.source.transaction(async (manager) => {
        // The arena lock serializes catalog edits and bookings, even across sports.
        await manager.getRepository(Arena).findOne({
          where: { id: input.arenaId },
          lock: { mode: 'pessimistic_write' },
        });
        const arena = await this.validateLink(manager, input);
        const sport = await manager
          .getRepository(Sport)
          .findOneByOrFail({ id: input.sportId });
        const schedule = await manager
          .getRepository(Schedule)
          .findOneBy({ id: input.scheduleId });
        if (!schedule)
          throw new DomainError(
            'not_found',
            'SCHEDULE_NOT_FOUND',
            'Schedule not found',
          );
        const scheduledAt = new Date(`${input.date}T${schedule.horary}Z`);
        assertFutureSlot(scheduledAt, clock());
        const maxPlayers = input.maxPlayers ?? sport.defaultValuePlayerNumbers;
        const row = await manager.getRepository(Appointment).save({
          organizerId: actor,
          title: input.title?.trim() || sport.name.slice(0, 100),
          description: input.description ?? null,
          scheduledAt,
          status: 'scheduled',
          arenaId: arena.id,
          sportId: sport.id,
          scheduleId: schedule.id,
          maxPlayers,
          location: {
            type: 'Point',
            coordinates: [Number(arena.longitude), Number(arena.lat)],
          },
          createdAt: clock(),
          updatedAt: clock(),
        });
        await manager.getRepository(UserAppointment).insert({
          userId: actor,
          appointmentId: row.id,
          holder: input.holder,
        });
        row.arena = arena;
        row.sport = sport;
        return card(row, actor, 1, input.holder ? 1 : 0, true, null);
      }),
    );
  }
}
