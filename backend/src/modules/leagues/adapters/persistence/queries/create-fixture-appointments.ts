import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { CreateFixtureAppointmentsQueries } from '../../../application/ports/create-fixture-appointments-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function createFixtureAppointmentsQueries(
  executor: SqlExecutor,
): CreateFixtureAppointmentsQueries {
  return {
    createFixtureAppointmentsFindCompatibleArena: (arenaId, sportId) =>
      databaseWrite(() =>
        executor.query<{ address: string; lat: string; longitude: string }[]>(
          `SELECT arena.address, arena.lat::text AS lat, arena.longitude::text AS longitude
       FROM public.arena arena
       JOIN public.sport_arena sa ON sa.arena_id=arena.id AND sa.sport_id=$2
       WHERE arena.id=$1`,
          [arenaId, sportId],
        ),
      ),
    createFixtureAppointmentsFindSchedule: (scheduleId) =>
      databaseWrite(() =>
        executor.query<{ horary: string }[]>(
          `SELECT horary FROM public.schedule WHERE id=$1`,
          [scheduleId],
        ),
      ),
    createFixtureAppointmentsCheckSlot: (arenaId, scheduledAt) =>
      databaseWrite(() =>
        executor.query<{ available: boolean }[]>(
          `SELECT NOT EXISTS (
           SELECT 1 FROM public.appointment
           WHERE arena_id=$1 AND scheduled_at=$2 AND deleted_at IS NULL
             AND status IN ('scheduled', 'in_progress')
         ) AS available`,
          [arenaId, scheduledAt],
        ),
      ),
    createFixtureAppointmentsInsertAppointment: (
      actor,
      value2,
      value3,
      scheduledAt,
      longitude,
      lat,
      maxPlayers,
      arenaId,
      sportId,
      scheduleId,
    ) =>
      databaseWrite(() =>
        executor.query<{ id: string }[]>(
          `INSERT INTO public.appointment (
           organizer_id, title, description, scheduled_at, status, location,
           max_players, arena_id, sport_id, schedule_id, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, 'scheduled',
           ST_SetSRID(ST_MakePoint($5, $6), 0),
           $7, $8, $9, $10, now(), now()
         ) RETURNING id::text AS id`,
          [
            actor,
            value2,
            value3,
            scheduledAt,
            longitude,
            lat,
            maxPlayers,
            arenaId,
            sportId,
            scheduleId,
          ],
        ),
      ),
    createFixtureAppointmentsInsertMatch: (
      leagueId,
      appointmentId,
      matchNumber,
      homeTeamId,
      awayTeamId,
      phase,
      roundNumber,
      groupNumber,
    ) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.league_match (
           league_id, appointment_id, match_number, home_team_id, away_team_id,
           phase, round_number, group_number
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            leagueId,
            appointmentId,
            matchNumber,
            homeTeamId,
            awayTeamId,
            phase,
            roundNumber,
            groupNumber,
          ],
        ),
      ),
    createFixtureAppointmentsAddTeamParticipants: (
      appointmentId,
      homeTeamId,
      awayTeamId,
    ) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.user_appointment (appointment_id, user_id, holder)
         SELECT $1, user_id, true FROM public.user_team
         WHERE team_id IN ($2, $3)
         ON CONFLICT (appointment_id, user_id) DO NOTHING`,
          [appointmentId, homeTeamId, awayTeamId],
        ),
      ),
    createFixtureAppointmentsAddOrganizer: (appointmentId, actor) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.user_appointment (appointment_id, user_id, holder)
         VALUES ($1, $2, false)
         ON CONFLICT (appointment_id, user_id) DO NOTHING`,
          [appointmentId, actor],
        ),
      ),
    createFixtureAppointmentsActivateLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league SET status='active'
         WHERE id=$1 AND status='open'`,
          [leagueId],
        ),
      ),
  };
}
