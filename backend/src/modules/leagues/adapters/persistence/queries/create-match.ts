import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { CreateMatchQueries } from '../../../application/ports/create-match-queries.port.js';
import type { SqlExecutor } from '../sql-executor.js';
export function createMatchQueries(executor: SqlExecutor): CreateMatchQueries {
  return {
    createMatchLockLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<
          {
            name: string;
            ownerId: string | null;
            sportId: string | null;
            status: string;
          }[]
        >(
          `SELECT name, owner_id::text AS "ownerId", sport_id::text AS "sportId",
             status
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        ),
      ),
    createMatchFindRegisteredTeams: (leagueId, homeTeamId, awayTeamId) =>
      databaseWrite(() =>
        executor.query<{ count: number }[]>(
          `SELECT count(*)::int AS count FROM public.league_team
           WHERE league_id=$1 AND team_id IN ($2, $3)`,
          [leagueId, homeTeamId, awayTeamId],
        ),
      ),
    createMatchLockArena: (arenaId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `SELECT id FROM public.arena WHERE id=$1 FOR UPDATE`,
          [arenaId],
        ),
      ),
    createMatchFindCompatibleArena: (arenaId, sportId) =>
      databaseWrite(() =>
        executor.query<{ address: string; lat: string; longitude: string }[]>(
          `SELECT arena.address, arena.lat::text AS lat, arena.longitude::text AS longitude
           FROM public.arena arena
           JOIN public.sport_arena sa ON sa.arena_id=arena.id AND sa.sport_id=$2
           WHERE arena.id=$1`,
          [arenaId, sportId],
        ),
      ),
    createMatchFindSchedule: (scheduleId) =>
      databaseWrite(() =>
        executor.query<{ horary: string }[]>(
          `SELECT horary FROM public.schedule WHERE id=$1`,
          [scheduleId],
        ),
      ),
    createMatchCheckSlot: (arenaId, scheduledAt) =>
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
    createMatchFindSport: (sportId) =>
      databaseWrite(() =>
        executor.query<{ name: string; maxPlayers: number }[]>(
          `SELECT name, default_value_player_numbers AS "maxPlayers"
           FROM public.sport WHERE id=$1`,
          [sportId],
        ),
      ),
    createMatchNextMatchNumber: (leagueId) =>
      databaseWrite(() =>
        executor.query<{ number: number }[]>(
          `SELECT COALESCE(MAX(match_number), 0)::int + 1 AS number
           FROM public.league_match WHERE league_id=$1`,
          [leagueId],
        ),
      ),
    createMatchInsertAppointment: (
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
    createMatchInsertMatch: (
      leagueId,
      appointmentId,
      matchNumber,
      homeTeamId,
      awayTeamId,
    ) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.league_match
             (league_id, appointment_id, match_number, home_team_id, away_team_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [leagueId, appointmentId, matchNumber, homeTeamId, awayTeamId],
        ),
      ),
    createMatchAddTeamParticipants: (appointmentId, homeTeamId, awayTeamId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.user_appointment (appointment_id, user_id, holder)
           SELECT $1, user_id, true FROM public.user_team
           WHERE team_id IN ($2, $3)
           ON CONFLICT (appointment_id, user_id) DO NOTHING`,
          [appointmentId, homeTeamId, awayTeamId],
        ),
      ),
    createMatchAddOrganizer: (appointmentId, actor) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `INSERT INTO public.user_appointment (appointment_id, user_id, holder)
           VALUES ($1, $2, false)
           ON CONFLICT (appointment_id, user_id) DO NOTHING`,
          [appointmentId, actor],
        ),
      ),
    createMatchActivateLeague: (leagueId) =>
      databaseWrite(() =>
        executor.query<unknown>(
          `UPDATE public.league SET status='active'
           WHERE id=$1 AND status='open'`,
          [leagueId],
        ),
      ),
  };
}
