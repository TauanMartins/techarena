import { DataSource } from 'typeorm';
import { DomainError } from '../../../../common/domain/domain-error.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import { assertFutureSlot } from '../../../appointments/domain/booking-policy.js';
import type {
  LeagueArena,
  LeagueAvailabilityQuery,
  LeagueDetails,
  LeagueInput,
  LeagueMatchInput,
  LeagueMatchView,
  LeagueResultInput,
  LeagueStanding,
  LeagueSummary,
  LeagueTeamView,
  LeaguesRepository,
} from '../../domain/leagues.port.js';

type SummaryRow = LeagueSummary & {
  teamCount: number | string;
  matchCount: number | string;
  completedMatchCount: number | string;
  isOwner: boolean;
};

function mapSummary(row: SummaryRow): LeagueSummary {
  return {
    ...row,
    teamCount: Number(row.teamCount),
    matchCount: Number(row.matchCount),
    completedMatchCount: Number(row.completedMatchCount),
    isOwner: Boolean(row.isOwner),
  };
}

export class TypeormLeaguesRepository implements LeaguesRepository {
  constructor(private readonly source: DataSource) {}

  private async summary(actor: string, leagueId?: string) {
    const rows = await this.source.query<SummaryRow[]>(
      `
        SELECT l.id::text AS id, l.name, l.description, l.image,
          l.owner_id::text AS "ownerId", owner.name AS "ownerName",
          l.sport_id::text AS "sportId", sport.name AS "sportName",
          l.created_at AS "createdAt",
          (SELECT count(*)::int FROM public.league_team lt WHERE lt.league_id=l.id) AS "teamCount",
          (SELECT count(*)::int FROM public.league_match lm WHERE lm.league_id=l.id) AS "matchCount",
          (SELECT count(*)::int FROM public.league_match lm
            JOIN public.appointment a ON a.id=lm.appointment_id
            WHERE lm.league_id=l.id AND a.status='finished') AS "completedMatchCount",
          COALESCE(l.owner_id=$1::uuid, false) AS "isOwner"
        FROM public.league l
        LEFT JOIN public.users owner ON owner.id=l.owner_id
        LEFT JOIN public.sport sport ON sport.id=l.sport_id
        WHERE ($2::bigint IS NULL OR l.id=$2)
        ORDER BY l.created_at DESC, l.id DESC
      `,
      [actor, leagueId ?? null],
    );
    return rows.map(mapSummary);
  }

  async list(actor: string) {
    return this.summary(actor);
  }

  async details(actor: string, leagueId: string): Promise<LeagueDetails> {
    const league = (await this.summary(actor, leagueId))[0];
    if (!league)
      throw new DomainError(
        'not_found',
        'LEAGUE_NOT_FOUND',
        'League not found',
      );

    const teams = await this.source.query<LeagueTeamView[]>(
      `
        SELECT t.id::text AS id, t.name, t.image,
          captain.name AS "captainName"
        FROM public.league_team lt
        JOIN public.team t ON t.id=lt.team_id
        LEFT JOIN public.user_team ut ON ut.team_id=t.id AND ut.role='captain'
        LEFT JOIN public.users captain ON captain.id=ut.user_id
        WHERE lt.league_id=$1
        ORDER BY lower(t.name), t.id
      `,
      [leagueId],
    );
    const matches = await this.source.query<LeagueMatchView[]>(
      `
        SELECT lm.id::text AS id, lm.appointment_id::text AS "appointmentId",
          lm.match_number AS "matchNumber", a.scheduled_at AS "scheduledAt",
          a.status,
          (a.status <> 'canceled' AND a.scheduled_at <= CURRENT_TIMESTAMP) AS "resultAllowed",
          arena.address AS "arenaAddress",
          json_build_object('id', home.id::text, 'name', home.name, 'image', home.image) AS "homeTeam",
          json_build_object('id', away.id::text, 'name', away.name, 'image', away.image) AS "awayTeam",
          CASE WHEN result.id IS NULL THEN NULL ELSE json_build_object(
            'winnerTeamId', result.winner_team_id::text,
            'homeScore', CASE WHEN result.winner_team_id IS NULL
              THEN result.winner_score
              WHEN result.winner_team_id=home.id THEN result.winner_score
              ELSE result.loser_score END,
            'awayScore', CASE WHEN result.winner_team_id IS NULL
              THEN result.loser_score
              WHEN result.winner_team_id=away.id THEN result.winner_score
              ELSE result.loser_score END
          ) END AS result
        FROM public.league_match lm
        JOIN public.appointment a ON a.id=lm.appointment_id
        LEFT JOIN public.arena arena ON arena.id=a.arena_id
        JOIN public.team home ON home.id=lm.home_team_id
        JOIN public.team away ON away.id=lm.away_team_id
        LEFT JOIN public.appointment_result result ON result.appointment_id=a.id
        WHERE lm.league_id=$1
        ORDER BY a.scheduled_at, lm.match_number
      `,
      [leagueId],
    );
    for (const match of matches) {
      if (match.result) {
        match.result.homeScore = Number(match.result.homeScore);
        match.result.awayScore = Number(match.result.awayScore);
      }
      match.matchNumber = Number(match.matchNumber);
    }
    const standings = await this.source.query<LeagueStanding[]>(
      `
        SELECT t.id::text AS "teamId", t.name AS "teamName", t.image,
          count(result.id)::int AS played,
          count(result.id) FILTER (WHERE result.winner_team_id=t.id)::int AS wins,
          count(result.id) FILTER (WHERE result.loser_team_id=t.id)::int AS losses,
          count(result.id) FILTER (WHERE result.winner_team_id IS NULL AND result.loser_team_id IS NULL)::int AS draws,
          (count(result.id) FILTER (WHERE result.winner_team_id=t.id) * 3
            + count(result.id) FILTER (WHERE result.winner_team_id IS NULL AND result.loser_team_id IS NULL))::int AS points,
          COALESCE(sum(CASE WHEN result.winner_team_id=t.id THEN result.winner_score
            WHEN result.loser_team_id=t.id THEN result.loser_score
            WHEN result.winner_team_id IS NULL AND lm.home_team_id=t.id THEN result.winner_score
            WHEN result.winner_team_id IS NULL AND lm.away_team_id=t.id THEN result.loser_score END), 0)::int AS "scoreFor",
          COALESCE(sum(CASE WHEN result.winner_team_id=t.id THEN result.loser_score
            WHEN result.loser_team_id=t.id THEN result.winner_score
            WHEN result.winner_team_id IS NULL AND lm.home_team_id=t.id THEN result.loser_score
            WHEN result.winner_team_id IS NULL AND lm.away_team_id=t.id THEN result.winner_score END), 0)::int AS "scoreAgainst"
        FROM public.league_team lt
        JOIN public.team t ON t.id=lt.team_id
        LEFT JOIN public.league_match lm ON lm.league_id=lt.league_id
          AND t.id IN (lm.home_team_id, lm.away_team_id)
        LEFT JOIN public.appointment_result result ON result.appointment_id=lm.appointment_id
        WHERE lt.league_id=$1
        GROUP BY t.id, t.name, t.image
        ORDER BY points DESC, wins DESC, ("scoreFor" - "scoreAgainst") DESC, lower(t.name), t.id
      `,
      [leagueId],
    );
    for (const standing of standings) {
      standing.played = Number(standing.played);
      standing.wins = Number(standing.wins);
      standing.losses = Number(standing.losses);
      standing.draws = Number(standing.draws);
      standing.points = Number(standing.points);
      standing.scoreFor = Number(standing.scoreFor);
      standing.scoreAgainst = Number(standing.scoreAgainst);
    }
    const captainRows = await this.source.query<{ teamId: string }[]>(
      `SELECT ut.team_id::text AS "teamId"
       FROM public.user_team ut
       JOIN public.league_team lt ON lt.team_id=ut.team_id
       WHERE lt.league_id=$1 AND ut.user_id=$2 AND ut.role='captain'`,
      [leagueId, actor],
    );
    return {
      league,
      teams,
      matches,
      standings,
      myCaptainTeamIds: captainRows.map((row) => row.teamId),
    };
  }

  async create(actor: string, input: LeagueInput) {
    return databaseWrite(async () => {
      const created = await this.source.query<{ id: string }[]>(
        `INSERT INTO public.league (name, description, owner_id, sport_id)
         VALUES ($1, $2, $3, $4) RETURNING id::text AS id`,
        [input.name, input.description ?? null, actor, input.sportId],
      );
      return (await this.summary(actor, created[0].id))[0];
    });
  }

  async registerTeam(actor: string, leagueId: string, teamId: string) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const rows = await manager.query<
          {
            ownerId: string | null;
            sportId: string | null;
            registered: boolean;
            captain: boolean;
          }[]
        >(
          `SELECT l.owner_id::text AS "ownerId", l.sport_id::text AS "sportId",
          EXISTS(SELECT 1 FROM public.league_team WHERE league_id=l.id AND team_id=$2) AS registered,
          EXISTS(SELECT 1 FROM public.user_team WHERE team_id=$2 AND user_id=$3 AND role='captain') AS captain
         FROM public.league l WHERE l.id=$1
         FOR UPDATE OF l`,
          [leagueId, teamId, actor],
        );
        const league = rows[0];
        if (!league)
          throw new DomainError(
            'not_found',
            'LEAGUE_NOT_FOUND',
            'League not found',
          );
        if (!league.ownerId || !league.sportId)
          throw new DomainError(
            'conflict',
            'LEAGUE_NOT_CONFIGURED',
            'This legacy league is missing its organizer or sport',
          );
        if (league.registered)
          throw new DomainError(
            'conflict',
            'TEAM_ALREADY_REGISTERED',
            'This team is already registered',
          );
        if (league.ownerId !== actor && !league.captain)
          throw new DomainError(
            'forbidden',
            'LEAGUE_TEAM_REGISTRATION_FORBIDDEN',
            'Only the league organizer or a team captain can register a team',
          );
        await manager.query(
          `INSERT INTO public.league_team (team_id, league_id) VALUES ($1, $2)`,
          [teamId, leagueId],
        );
      }),
    );
  }

  async removeTeam(actor: string, leagueId: string, teamId: string) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const leagues = await manager.query<{ ownerId: string | null }[]>(
          `SELECT owner_id::text AS "ownerId"
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        );
        const league = leagues[0];
        if (!league)
          throw new DomainError(
            'not_found',
            'LEAGUE_NOT_FOUND',
            'League not found',
          );
        const rows = await manager.query<
          { registered: boolean; captain: boolean; hasMatches: boolean }[]
        >(
          `SELECT EXISTS(
              SELECT 1 FROM public.league_team
              WHERE league_id=$1 AND team_id=$2
            ) AS registered,
            EXISTS(SELECT 1 FROM public.user_team WHERE team_id=$2 AND user_id=$3 AND role='captain') AS captain,
            EXISTS(SELECT 1 FROM public.league_match
              WHERE league_id=$1 AND (home_team_id=$2 OR away_team_id=$2)) AS "hasMatches"`,
          [leagueId, teamId, actor],
        );
        const membership = rows[0];
        if (!membership.registered)
          throw new DomainError(
            'not_found',
            'LEAGUE_TEAM_NOT_FOUND',
            'League team not found',
          );
        if (league.ownerId !== actor && !membership.captain)
          throw new DomainError(
            'forbidden',
            'LEAGUE_TEAM_REMOVAL_FORBIDDEN',
            'Only the league organizer or a team captain can remove a team',
          );
        if (membership.hasMatches)
          throw new DomainError(
            'conflict',
            'LEAGUE_TEAM_HAS_MATCHES',
            'A team with scheduled matches cannot be removed',
          );
        await manager.query(
          `DELETE FROM public.league_team WHERE league_id=$1 AND team_id=$2`,
          [leagueId, teamId],
        );
      }),
    );
  }

  async arenas(leagueId: string): Promise<LeagueArena[]> {
    const rows = await this.source.query<LeagueArena[]>(
      `SELECT DISTINCT arena.id::text AS id, arena.address, arena.image
       FROM public.league l
       JOIN public.sport_arena sa ON sa.sport_id=l.sport_id
       JOIN public.arena arena ON arena.id=sa.arena_id
       WHERE l.id=$1 AND arena.is_league_only=true
       ORDER BY arena.address, arena.id`,
      [leagueId],
    );
    if (!rows.length) {
      const exists = await this.source.query(
        `SELECT 1 FROM public.league WHERE id=$1`,
        [leagueId],
      );
      if (!exists.length)
        throw new DomainError(
          'not_found',
          'LEAGUE_NOT_FOUND',
          'League not found',
        );
    }
    return rows;
  }

  async availability(
    leagueId: string,
    query: LeagueAvailabilityQuery,
    now: Date,
  ) {
    const leagues = await this.source.query<{ sportId: string | null }[]>(
      `SELECT sport_id::text AS "sportId"
       FROM public.league WHERE id=$1`,
      [leagueId],
    );
    if (!leagues.length)
      throw new DomainError(
        'not_found',
        'LEAGUE_NOT_FOUND',
        'League not found',
      );
    if (!leagues[0].sportId)
      throw new DomainError(
        'conflict',
        'LEAGUE_SPORT_MISSING',
        'The league has no sport configured',
      );
    const validArena = await this.source.query<{ id: string }[]>(
      `SELECT arena.id::text AS id
       FROM public.league l
       JOIN public.sport_arena sa ON sa.sport_id=l.sport_id AND sa.arena_id=$2
       JOIN public.arena arena ON arena.id=sa.arena_id AND arena.is_league_only=true
       WHERE l.id=$1`,
      [leagueId, query.arenaId],
    );
    if (!validArena.length)
      throw new DomainError(
        'invalid',
        'LEAGUE_ARENA_UNAVAILABLE',
        'The selected arena is not available for this league',
      );
    return this.source.query<{ id: string; horary: string }[]>(
      `SELECT schedule.id::text AS id, schedule.horary
       FROM public.schedule schedule
       WHERE ((CAST($1 AS date) + schedule.horary) AT TIME ZONE 'UTC') > $2
         AND NOT EXISTS (
           SELECT 1 FROM public.appointment a
           WHERE a.arena_id=$3
             AND a.scheduled_at=((CAST($1 AS date) + schedule.horary) AT TIME ZONE 'UTC')
             AND a.deleted_at IS NULL AND a.status IN ('scheduled', 'in_progress')
         )
       ORDER BY schedule.horary`,
      [query.date, now, query.arenaId],
    );
  }

  async createMatch(
    actor: string,
    leagueId: string,
    input: LeagueMatchInput,
    now: Date,
  ) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const leagues = await manager.query<
          { name: string; ownerId: string | null; sportId: string | null }[]
        >(
          `SELECT name, owner_id::text AS "ownerId", sport_id::text AS "sportId"
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        );
        const league = leagues[0];
        if (!league)
          throw new DomainError(
            'not_found',
            'LEAGUE_NOT_FOUND',
            'League not found',
          );
        if (league.ownerId !== actor)
          throw new DomainError(
            'forbidden',
            'LEAGUE_MATCH_CREATION_FORBIDDEN',
            'Only the league organizer can schedule matches',
          );
        if (!league.sportId)
          throw new DomainError(
            'conflict',
            'LEAGUE_SPORT_MISSING',
            'The league has no sport configured',
          );
        const registered = await manager.query<{ count: number }[]>(
          `SELECT count(*)::int AS count FROM public.league_team
           WHERE league_id=$1 AND team_id IN ($2, $3)`,
          [leagueId, input.homeTeamId, input.awayTeamId],
        );
        if (Number(registered[0].count) !== 2)
          throw new DomainError(
            'invalid',
            'LEAGUE_TEAMS_NOT_REGISTERED',
            'Both teams must be registered in this league',
          );

        await manager.query(
          `SELECT id FROM public.arena WHERE id=$1 FOR UPDATE`,
          [input.arenaId],
        );
        const arenas = await manager.query<
          { address: string; lat: string; longitude: string }[]
        >(
          `SELECT arena.address, arena.lat::text AS lat, arena.longitude::text AS longitude
           FROM public.arena arena
           JOIN public.sport_arena sa ON sa.arena_id=arena.id AND sa.sport_id=$2
           WHERE arena.id=$1 AND arena.is_league_only=true`,
          [input.arenaId, league.sportId],
        );
        const arena = arenas[0];
        if (!arena)
          throw new DomainError(
            'invalid',
            'LEAGUE_ARENA_UNAVAILABLE',
            'Choose an arena reserved for leagues and supporting this sport',
          );
        const schedules = await manager.query<{ horary: string }[]>(
          `SELECT horary FROM public.schedule WHERE id=$1`,
          [input.scheduleId],
        );
        if (!schedules.length)
          throw new DomainError(
            'not_found',
            'SCHEDULE_NOT_FOUND',
            'Schedule not found',
          );
        const scheduledAt = new Date(`${input.date}T${schedules[0].horary}Z`);
        assertFutureSlot(scheduledAt, now);
        const available = await manager.query<{ available: boolean }[]>(
          `SELECT NOT EXISTS (
             SELECT 1 FROM public.appointment
             WHERE arena_id=$1 AND scheduled_at=$2 AND deleted_at IS NULL
               AND status IN ('scheduled', 'in_progress')
           ) AS available`,
          [input.arenaId, scheduledAt],
        );
        if (!available[0].available)
          throw new DomainError(
            'conflict',
            'ARENA_SLOT_TAKEN',
            'The selected arena and time are no longer available',
          );

        const sportRows = await manager.query<
          { name: string; maxPlayers: number }[]
        >(
          `SELECT name, default_value_player_numbers AS "maxPlayers"
           FROM public.sport WHERE id=$1`,
          [league.sportId],
        );
        const nextNumber = await manager.query<{ number: number }[]>(
          `SELECT COALESCE(MAX(match_number), 0)::int + 1 AS number
           FROM public.league_match WHERE league_id=$1`,
          [leagueId],
        );
        const matchNumber = Number(nextNumber[0].number);
        const appointments = await manager.query<{ id: string }[]>(
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
            `${league.name} - Partida ${matchNumber}`.slice(0, 100),
            `Partida ${matchNumber} da liga ${league.name}`,
            scheduledAt,
            arena.longitude,
            arena.lat,
            sportRows[0].maxPlayers,
            input.arenaId,
            league.sportId,
            input.scheduleId,
          ],
        );
        const appointmentId = appointments[0].id;
        await manager.query(
          `INSERT INTO public.league_match
             (league_id, appointment_id, match_number, home_team_id, away_team_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            leagueId,
            appointmentId,
            matchNumber,
            input.homeTeamId,
            input.awayTeamId,
          ],
        );
        await manager.query(
          `INSERT INTO public.user_appointment (appointment_id, user_id, holder)
           SELECT $1, user_id, true FROM public.user_team
           WHERE team_id IN ($2, $3)
           ON CONFLICT (appointment_id, user_id) DO NOTHING`,
          [appointmentId, input.homeTeamId, input.awayTeamId],
        );
        await manager.query(
          `INSERT INTO public.user_appointment (appointment_id, user_id, holder)
           VALUES ($1, $2, false)
           ON CONFLICT (appointment_id, user_id) DO NOTHING`,
          [appointmentId, actor],
        );
      }),
    );
  }

  async recordResult(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueResultInput,
  ) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const rows = await manager.query<
          {
            organizerId: string | null;
            appointmentId: string;
            homeTeamId: string;
            awayTeamId: string;
            resultAllowed: boolean;
          }[]
        >(
          `SELECT l.owner_id::text AS "organizerId",
             lm.appointment_id::text AS "appointmentId",
             lm.home_team_id::text AS "homeTeamId",
             lm.away_team_id::text AS "awayTeamId",
             (a.status <> 'canceled' AND a.scheduled_at <= CURRENT_TIMESTAMP) AS "resultAllowed"
           FROM public.league_match lm
           JOIN public.league l ON l.id=lm.league_id
           JOIN public.appointment a ON a.id=lm.appointment_id
           WHERE lm.league_id=$1 AND lm.id=$2
           FOR UPDATE OF lm`,
          [leagueId, matchId],
        );
        const match = rows[0];
        if (!match)
          throw new DomainError(
            'not_found',
            'LEAGUE_MATCH_NOT_FOUND',
            'Match not found',
          );
        if (match.organizerId !== actor)
          throw new DomainError(
            'forbidden',
            'LEAGUE_RESULT_FORBIDDEN',
            'Only the league organizer can record match results',
          );
        if (!match.resultAllowed)
          throw new DomainError(
            'conflict',
            'LEAGUE_MATCH_NOT_PLAYED',
            'A result can only be recorded after a scheduled match',
          );
        const isDraw = input.homeScore === input.awayScore;
        const winnerTeamId = isDraw
          ? null
          : input.homeScore > input.awayScore
            ? match.homeTeamId
            : match.awayTeamId;
        const loserTeamId = isDraw
          ? null
          : input.homeScore > input.awayScore
            ? match.awayTeamId
            : match.homeTeamId;
        const winnerScore = isDraw
          ? input.homeScore
          : Math.max(input.homeScore, input.awayScore);
        const loserScore = isDraw
          ? input.awayScore
          : Math.min(input.homeScore, input.awayScore);
        await manager.query(
          `INSERT INTO public.appointment_result
             (appointment_id, winner_team_id, loser_team_id, winner_score, loser_score, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, now(), now())
           ON CONFLICT (appointment_id) DO UPDATE SET
             winner_team_id=EXCLUDED.winner_team_id,
             loser_team_id=EXCLUDED.loser_team_id,
             winner_score=EXCLUDED.winner_score,
             loser_score=EXCLUDED.loser_score,
             updated_at=now()`,
          [
            match.appointmentId,
            winnerTeamId,
            loserTeamId,
            winnerScore,
            loserScore,
          ],
        );
        await manager.query(
          `UPDATE public.appointment SET status='finished', updated_at=now()
           WHERE id=$1`,
          [match.appointmentId],
        );
      }),
    );
  }
}
