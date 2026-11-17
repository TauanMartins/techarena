import { databaseWrite } from '../../../../../common/persistence/database-write.js';
import type { DetailsQueries } from '../../../application/ports/details-queries.port.js';
import type {
  LeagueMatchView,
  LeagueStanding,
  LeagueTeamInvitationView,
  LeagueTeamView,
} from '../../../domain/league.js';
import type { SqlExecutor } from '../sql-executor.js';
export function detailsQueries(executor: SqlExecutor): DetailsQueries {
  return {
    detailsListTeams: (leagueId) =>
      databaseWrite(() =>
        executor.query<LeagueTeamView[]>(
          `
        SELECT t.id::text AS id, t.name, t.image,
          lt.group_number AS "groupNumber",
          captain.name AS "captainName"
        FROM public.league_team lt
        JOIN public.team t ON t.id=lt.team_id
        LEFT JOIN public.user_team ut ON ut.team_id=t.id AND ut.role='captain'
        LEFT JOIN public.users captain ON captain.id=ut.user_id
        WHERE lt.league_id=$1
        ORDER BY lower(t.name), t.id
      `,
          [leagueId],
        ),
      ),
    detailsListMatches: (leagueId) =>
      databaseWrite(() =>
        executor.query<LeagueMatchView[]>(
          `
        SELECT lm.id::text AS id, lm.appointment_id::text AS "appointmentId",
          lm.match_number AS "matchNumber", a.scheduled_at AS "scheduledAt",
          lm.phase, lm.round_number AS "roundNumber",
          lm.group_number AS "groupNumber",
          a.status,
          (a.status <> 'canceled' AND a.scheduled_at <= CURRENT_TIMESTAMP) AS "resultAllowed",
          arena.address AS "arenaAddress",
          json_build_object(
            'id', home.id::text, 'name', home.name, 'image', home.image,
            'captainName', (SELECT captain.name FROM public.user_team home_ut
              JOIN public.users captain ON captain.id=home_ut.user_id
              WHERE home_ut.team_id=home.id AND home_ut.role='captain' LIMIT 1),
            'groupNumber', (SELECT home_lt.group_number FROM public.league_team home_lt
              WHERE home_lt.league_id=lm.league_id AND home_lt.team_id=home.id)
          ) AS "homeTeam",
          json_build_object(
            'id', away.id::text, 'name', away.name, 'image', away.image,
            'captainName', (SELECT captain.name FROM public.user_team away_ut
              JOIN public.users captain ON captain.id=away_ut.user_id
              WHERE away_ut.team_id=away.id AND away_ut.role='captain' LIMIT 1),
            'groupNumber', (SELECT away_lt.group_number FROM public.league_team away_lt
              WHERE away_lt.league_id=lm.league_id AND away_lt.team_id=away.id)
          ) AS "awayTeam",
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
        ),
      ),
    detailsListStandings: (leagueId) =>
      databaseWrite(() =>
        executor.query<LeagueStanding[]>(
          `
        SELECT * FROM (
          SELECT t.id::text AS "teamId", t.name AS "teamName", t.image,
          lt.group_number AS "groupNumber",
          count(result.id) FILTER (
            WHERE lm.phase IN ('group', 'manual')
          )::int AS played,
          count(result.id) FILTER (WHERE lm.phase IN ('group', 'manual') AND result.winner_team_id=t.id)::int AS wins,
          count(result.id) FILTER (WHERE lm.phase IN ('group', 'manual') AND result.loser_team_id=t.id)::int AS losses,
          count(result.id) FILTER (WHERE lm.phase IN ('group', 'manual') AND result.winner_team_id IS NULL AND result.loser_team_id IS NULL)::int AS draws,
          (count(result.id) FILTER (WHERE lm.phase IN ('group', 'manual') AND result.winner_team_id=t.id) * 3
            + count(result.id) FILTER (WHERE lm.phase IN ('group', 'manual') AND result.winner_team_id IS NULL AND result.loser_team_id IS NULL))::int AS points,
          COALESCE(sum(CASE WHEN result.winner_team_id=t.id THEN result.winner_score
            WHEN result.loser_team_id=t.id THEN result.loser_score
            WHEN result.winner_team_id IS NULL AND lm.home_team_id=t.id THEN result.winner_score
            WHEN result.winner_team_id IS NULL AND lm.away_team_id=t.id THEN result.loser_score END)
            FILTER (WHERE lm.phase IN ('group', 'manual')), 0)::int AS "scoreFor",
          COALESCE(sum(CASE WHEN result.winner_team_id=t.id THEN result.loser_score
            WHEN result.loser_team_id=t.id THEN result.winner_score
            WHEN result.winner_team_id IS NULL AND lm.home_team_id=t.id THEN result.loser_score
            WHEN result.winner_team_id IS NULL AND lm.away_team_id=t.id THEN result.winner_score END)
            FILTER (WHERE lm.phase IN ('group', 'manual')), 0)::int AS "scoreAgainst"
        FROM public.league_team lt
        JOIN public.team t ON t.id=lt.team_id
        LEFT JOIN public.league_match lm ON lm.league_id=lt.league_id
          AND t.id IN (lm.home_team_id, lm.away_team_id)
        LEFT JOIN public.appointment_result result ON result.appointment_id=lm.appointment_id
        WHERE lt.league_id=$1
        GROUP BY t.id, t.name, t.image, lt.group_number
        ) standings
        ORDER BY COALESCE("groupNumber", 0), points DESC, wins DESC,
          ("scoreFor" - "scoreAgainst") DESC,
          lower("teamName"), "teamId"
      `,
          [leagueId],
        ),
      ),
    detailsListCaptainTeams: (leagueId, actor) =>
      databaseWrite(() =>
        executor.query<{ teamId: string }[]>(
          `SELECT ut.team_id::text AS "teamId"
       FROM public.user_team ut
       JOIN public.league_team lt ON lt.team_id=ut.team_id
       WHERE lt.league_id=$1 AND ut.user_id=$2 AND ut.role='captain'`,
          [leagueId, actor],
        ),
      ),
    detailsListInvitations: (leagueId) =>
      databaseWrite(() =>
        executor.query<LeagueTeamInvitationView[]>(
          `SELECT invitation.id::text AS id, invitation.league_id::text AS "leagueId",
             league.name AS "leagueName", invitation.team_id::text AS "teamId",
             team.name AS "teamName", invitation.invited_at AS "invitedAt"
           FROM public.league_team_invitation invitation
           JOIN public.league ON league.id=invitation.league_id
           JOIN public.team ON team.id=invitation.team_id
           WHERE invitation.league_id=$1 AND invitation.status='pending'
           ORDER BY invitation.invited_at, invitation.id`,
          [leagueId],
        ),
      ),
  };
}
