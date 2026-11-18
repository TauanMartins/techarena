import type { EntityManager } from 'typeorm';
import { DataSource } from 'typeorm';
import { paginate } from '../../../../common/domain/pagination.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import { ARENA_DISTANCE_KM } from '../../../../common/persistence/queries.js';
import {
  Appointment,
  Arena,
  Schedule,
  Sport,
  SportArena,
  UserAppointment,
} from '../../../../database/entities/index.js';
import type {
  AppointmentsRepository,
  BookingTransaction,
} from '../../application/ports/appointments.port.js';
import type {
  AppointmentParticipant,
  AppointmentQuery,
  AvailabilityQuery,
  BookingCard,
} from '../../domain/appointment.js';
import type {
  BookingContext,
  BookingDraft,
} from '../../domain/booking-policy.js';
function card(
  a: Appointment,
  actor: string,
  players: number,
  startingPlayers: number,
  isInside: boolean,
  distanceKm: number | null,
  participants: AppointmentParticipant[] = [],
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
    participants,
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
    else if (!query.period || query.period === 'upcoming')
      q.andWhere(
        "appointment.status='scheduled' AND appointment.scheduledAt > CURRENT_TIMESTAMP",
      );
    if (query.period && query.period !== 'all')
      q.andWhere(
        query.period === 'past'
          ? 'appointment.scheduledAt <= CURRENT_TIMESTAMP'
          : "appointment.scheduledAt > CURRENT_TIMESTAMP AND appointment.status='scheduled'",
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
      if (query.distance !== 'none')
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
    const participantsByAppointment = new Map<
      string,
      AppointmentParticipant[]
    >();
    const appointmentIds = result.entities.map((appointment) => appointment.id);
    if (appointmentIds.length) {
      const participantRows = await this.source
        .getRepository(UserAppointment)
        .createQueryBuilder('membership')
        .innerJoin('membership.user', 'user')
        .select('membership.appointmentId', 'appointmentId')
        .addSelect('user.id', 'id')
        .addSelect('user.name', 'name')
        .addSelect('user.username', 'username')
        .addSelect('user.image', 'image')
        .addSelect('membership.holder', 'holder')
        .where('membership.appointmentId IN (:...appointmentIds)', {
          appointmentIds,
        })
        .orderBy('user.name', 'ASC', 'NULLS LAST')
        .addOrderBy('user.id', 'ASC')
        .getRawMany<AppointmentParticipant & { appointmentId: string }>();
      for (const { appointmentId, ...participant } of participantRows) {
        const participants = participantsByAppointment.get(appointmentId) ?? [];
        participants.push(participant);
        participantsByAppointment.set(appointmentId, participants);
      }
    }
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
          participantsByAppointment.get(a.id) ?? [],
        ),
      ),
      total,
      query,
    );
  }
  private async loadContext(
    manager: EntityManager,
    query: AvailabilityQuery,
    scheduleId?: string,
  ): Promise<BookingContext> {
    const arena = await manager
      .getRepository(Arena)
      .findOneBy({ id: query.arenaId });
    const sport = await manager
      .getRepository(Sport)
      .findOneBy({ id: query.sportId });
    const supportsSport = await manager
      .getRepository(SportArena)
      .existsBy({ arenaId: query.arenaId, sportId: query.sportId });
    const schedule = scheduleId
      ? await manager.getRepository(Schedule).findOneBy({ id: scheduleId })
      : null;
    return {
      arena: arena
        ? {
            id: arena.id,
            isLeagueOnly: arena.isLeagueOnly,
            lat: Number(arena.lat),
            longitude: Number(arena.longitude),
          }
        : null,
      sport: sport
        ? {
            id: sport.id,
            name: sport.name,
            defaultPlayers: sport.defaultValuePlayerNumbers,
          }
        : null,
      supportsSport,
      schedule: schedule ? { id: schedule.id, horary: schedule.horary } : null,
    };
  }
  context(query: AvailabilityQuery) {
    return this.loadContext(this.source.manager, query);
  }
  async available(query: AvailabilityQuery, now: Date) {
    const rows = await this.source
      .getRepository(Schedule)
      .createQueryBuilder('schedule')
      .where(
        "((CAST(:date AS date) + schedule.horary) AT TIME ZONE 'America/Sao_Paulo') > :now",
        {
          date: query.date,
          now,
        },
      )
      .andWhere(
        `NOT EXISTS(SELECT 1 FROM public.appointment a WHERE a.arena_id=:arenaId AND a.scheduled_at=((CAST(:date AS date)+schedule.horary) AT TIME ZONE 'America/Sao_Paulo') AND a.deleted_at IS NULL AND a.status IN ('scheduled','in_progress'))`,
        { arenaId: query.arenaId },
      )
      .orderBy('schedule.horary', 'ASC')
      .getMany();
    return rows.map((s) => ({ id: s.id, horary: s.horary }));
  }
  transaction<T>(work: (store: BookingTransaction) => Promise<T>): Promise<T> {
    return databaseWrite(() =>
      this.source.transaction((manager) =>
        work({
          context: async (query, scheduleId) => {
            // Same lock order as arena catalog edits; business decisions run after acquisition.
            await manager.getRepository(Arena).findOne({
              where: { id: query.arenaId },
              lock: { mode: 'pessimistic_write' },
            });
            return this.loadContext(manager, query, scheduleId);
          },
          insert: (draft) => this.insert(manager, draft),
        }),
      ),
    );
  }
  private async insert(
    manager: EntityManager,
    draft: BookingDraft,
  ): Promise<BookingCard> {
    const { holder, lat, longitude, ...data } = draft;
    const row = await manager.getRepository(Appointment).save({
      ...data,
      location: { type: 'Point', coordinates: [longitude, lat] },
    });
    await manager
      .getRepository(UserAppointment)
      .insert({ userId: draft.organizerId, appointmentId: row.id, holder });
    const saved = await manager.getRepository(Appointment).findOneOrFail({
      where: { id: row.id },
      relations: { arena: true, sport: true },
    });
    return card(saved, draft.organizerId, 1, holder ? 1 : 0, true, null, [
      {
        id: draft.organizerId,
        name: null,
        username: null,
        image: null,
        holder,
      },
    ]);
  }
}
