import { DataSource, type EntityManager } from 'typeorm';
import { DomainError } from '../../../../common/domain/domain-error.js';
import { databaseWrite } from '../../../../common/persistence/database-write.js';
import { assertFutureSlot } from '../../../appointments/domain/booking-policy.js';
import {
  buildInitialFixtures,
  buildKnockoutFixtures,
  assertTournamentConfiguration,
  assertTournamentOptions,
} from '../../domain/league-policy.js';
import type { Fixture } from '../../domain/league-policy.js';
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
  LeagueTeamInvitationView,
  LeagueUpdateInput,
  FixtureScheduleInput,
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

  private async createFixtureAppointments(
    manager: EntityManager,
    actor: string,
    leagueId: string,
    league: { name: string; sportId: string; maxPlayers: number },
    fixtures: Fixture[],
    input: FixtureScheduleInput,
    now: Date,
    firstMatchNumber: number,
  ) {
    const arenaRows = await manager.query<
      { address: string; lat: string; longitude: string }[]
    >(
      `SELECT arena.address, arena.lat::text AS lat, arena.longitude::text AS longitude
       FROM public.arena arena
       JOIN public.sport_arena sa ON sa.arena_id=arena.id AND sa.sport_id=$2
       WHERE arena.id=$1`,
      [input.arenaId, league.sportId],
    );
    const arena = arenaRows[0];
    if (!arena)
      throw new DomainError(
        'invalid',
        'LEAGUE_ARENA_UNAVAILABLE',
        'Choose an arena reserved for leagues and supporting this sport',
      );
    const scheduleRows = await manager.query<{ horary: string }[]>(
      `SELECT horary FROM public.schedule WHERE id=$1`,
      [input.scheduleId],
    );
    const schedule = scheduleRows[0];
    if (!schedule)
      throw new DomainError(
        'not_found',
        'SCHEDULE_NOT_FOUND',
        'Schedule not found',
      );

    for (const [index, fixture] of fixtures.entries()) {
      const fixtureDate = new Date(`${input.date}T00:00:00.000Z`);
      fixtureDate.setUTCDate(
        fixtureDate.getUTCDate() + index * input.daysBetweenMatches,
      );
      const date = fixtureDate.toISOString().slice(0, 10);
      const scheduledAt = new Date(`${date}T${schedule.horary}Z`);
      assertFutureSlot(scheduledAt, now);
      const slotRows = await manager.query<{ available: boolean }[]>(
        `SELECT NOT EXISTS (
           SELECT 1 FROM public.appointment
           WHERE arena_id=$1 AND scheduled_at=$2 AND deleted_at IS NULL
             AND status IN ('scheduled', 'in_progress')
         ) AS available`,
        [input.arenaId, scheduledAt],
      );
      if (!slotRows[0].available)
        throw new DomainError(
          'conflict',
          'ARENA_SLOT_TAKEN',
          `The arena is unavailable at ${date} ${schedule.horary.slice(0, 5)}`,
        );
      const matchNumber = firstMatchNumber + index;
      const appointmentRows = await manager.query<{ id: string }[]>(
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
          league.maxPlayers,
          input.arenaId,
          league.sportId,
          input.scheduleId,
        ],
      );
      const appointmentId = appointmentRows[0].id;
      await manager.query(
        `INSERT INTO public.league_match (
           league_id, appointment_id, match_number, home_team_id, away_team_id,
           phase, round_number, group_number
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          leagueId,
          appointmentId,
          matchNumber,
          fixture.homeTeamId,
          fixture.awayTeamId,
          fixture.phase,
          fixture.roundNumber,
          fixture.groupNumber,
        ],
      );
      await manager.query(
        `INSERT INTO public.user_appointment (appointment_id, user_id, holder)
         SELECT $1, user_id, true FROM public.user_team
         WHERE team_id IN ($2, $3)
         ON CONFLICT (appointment_id, user_id) DO NOTHING`,
        [appointmentId, fixture.homeTeamId, fixture.awayTeamId],
      );
      await manager.query(
        `INSERT INTO public.user_appointment (appointment_id, user_id, holder)
         VALUES ($1, $2, false)
         ON CONFLICT (appointment_id, user_id) DO NOTHING`,
        [appointmentId, actor],
      );
      await manager.query(
        `UPDATE public.league SET status='active'
         WHERE id=$1 AND status='open'`,
        [leagueId],
      );
    }
  }

  private async summary(actor: string, leagueId?: string) {
    const rows = await this.source.query<SummaryRow[]>(
      `
        SELECT l.id::text AS id, l.name, l.description, l.image,
          l.owner_id::text AS "ownerId", owner.name AS "ownerName",
          l.sport_id::text AS "sportId", sport.name AS "sportName",
          l.tournament_format AS "tournamentFormat", l.status,
          l.group_count AS "groupCount",
          l.qualifiers_per_group AS "qualifiersPerGroup",
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
    );
    const matches = await this.source.query<LeagueMatchView[]>(
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
    const invitations = league.isOwner
      ? await this.source.query<LeagueTeamInvitationView[]>(
          `SELECT invitation.id::text AS id, invitation.league_id::text AS "leagueId",
             league.name AS "leagueName", invitation.team_id::text AS "teamId",
             team.name AS "teamName", invitation.invited_at AS "invitedAt"
           FROM public.league_team_invitation invitation
           JOIN public.league ON league.id=invitation.league_id
           JOIN public.team ON team.id=invitation.team_id
           WHERE invitation.league_id=$1 AND invitation.status='pending'
           ORDER BY invitation.invited_at, invitation.id`,
          [leagueId],
        )
      : [];
    return {
      league,
      teams,
      invitations,
      matches,
      standings,
      myCaptainTeamIds: captainRows.map((row) => row.teamId),
    };
  }

  async create(actor: string, input: LeagueInput) {
    return databaseWrite(async () => {
      const created = await this.source.query<{ id: string }[]>(
        `INSERT INTO public.league (
           name, description, owner_id, sport_id, tournament_format,
           group_count, qualifiers_per_group
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id::text AS id`,
        [
          input.name,
          input.description ?? null,
          actor,
          input.sportId,
          input.tournamentFormat,
          input.groupCount ?? 2,
          input.qualifiersPerGroup ?? 2,
        ],
      );
      return (await this.summary(actor, created[0].id))[0];
    });
  }

  async update(actor: string, leagueId: string, input: LeagueUpdateInput) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const rows = await manager.query<
          { ownerId: string | null; matchCount: number }[]
        >(
          `SELECT l.owner_id::text AS "ownerId",
             (SELECT count(*)::int FROM public.league_match lm
               WHERE lm.league_id=l.id) AS "matchCount"
           FROM public.league l WHERE l.id=$1 FOR UPDATE OF l`,
          [leagueId],
        );
        const league = rows[0];
        if (!league)
          throw new DomainError(
            'not_found',
            'LEAGUE_NOT_FOUND',
            'League not found',
          );
        if (league.ownerId !== actor)
          throw new DomainError(
            'forbidden',
            'LEAGUE_UPDATE_FORBIDDEN',
            'Only the organizer can edit this league',
          );
        if (input.status)
          throw new DomainError(
            'invalid',
            'USE_LEAGUE_STATUS_ACTION',
            'Use the league status action to finish or cancel a league',
          );
        const changesTournament =
          input.sportId !== undefined ||
          input.tournamentFormat !== undefined ||
          input.groupCount !== undefined ||
          input.qualifiersPerGroup !== undefined;
        if (Number(league.matchCount) > 0 && changesTournament)
          throw new DomainError(
            'conflict',
            'LEAGUE_HAS_MATCHES',
            'Competition settings cannot change after matches have been scheduled',
          );
        if (
          input.tournamentFormat ||
          input.groupCount ||
          input.qualifiersPerGroup
        ) {
          const current = await manager.query<
            {
              tournamentFormat: LeagueInput['tournamentFormat'];
              groupCount: number;
              qualifiersPerGroup: number;
            }[]
          >(
            `SELECT tournament_format AS "tournamentFormat",
               group_count AS "groupCount",
               qualifiers_per_group AS "qualifiersPerGroup"
             FROM public.league WHERE id=$1`,
            [leagueId],
          );
          const settings = current[0];
          const format = input.tournamentFormat ?? settings.tournamentFormat;
          const groupCount = input.groupCount ?? settings.groupCount;
          const qualifiers =
            input.qualifiersPerGroup ?? settings.qualifiersPerGroup;
          assertTournamentOptions(format, groupCount, qualifiers);
        }
        await manager.query(
          `UPDATE public.league SET
             name=CASE WHEN $2 THEN $3 ELSE name END,
             description=CASE WHEN $4 THEN $5 ELSE description END,
             sport_id=CASE WHEN $6 THEN $7 ELSE sport_id END,
             tournament_format=CASE WHEN $8 THEN $9 ELSE tournament_format END,
             group_count=CASE WHEN $10 THEN $11 ELSE group_count END,
             qualifiers_per_group=CASE WHEN $12 THEN $13 ELSE qualifiers_per_group END
           WHERE id=$1`,
          [
            leagueId,
            input.name !== undefined,
            input.name ?? null,
            input.description !== undefined,
            input.description ?? null,
            input.sportId !== undefined,
            input.sportId ?? null,
            input.tournamentFormat !== undefined,
            input.tournamentFormat ?? null,
            input.groupCount !== undefined,
            input.groupCount ?? null,
            input.qualifiersPerGroup !== undefined,
            input.qualifiersPerGroup ?? null,
          ],
        );
      }),
    );
  }
  async registerTeam(actor: string, leagueId: string, teamId: string) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const rows = await manager.query<
          {
            ownerId: string | null;
            sportId: string | null;
            status: string;
            registered: boolean;
            captain: boolean;
          }[]
        >(
          `SELECT l.owner_id::text AS "ownerId", l.sport_id::text AS "sportId",
          l.status,
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
        if (league.status !== 'open')
          throw new DomainError(
            'conflict',
            'LEAGUE_REGISTRATION_CLOSED',
            'Teams can only be registered while league registrations are open',
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
        await manager.query(
          `UPDATE public.league_team_invitation
           SET status='accepted', responded_at=now()
           WHERE league_id=$1 AND team_id=$2 AND status='pending'`,
          [leagueId, teamId],
        );
      }),
    );
  }

  async inviteTeam(actor: string, leagueId: string, teamId: string) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const leagues = await manager.query<
          { ownerId: string | null; status: string }[]
        >(
          `SELECT owner_id::text AS "ownerId", status
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
            'LEAGUE_INVITATION_FORBIDDEN',
            'Only the league organizer can invite teams',
          );
        if (league.status !== 'open')
          throw new DomainError(
            'conflict',
            'LEAGUE_REGISTRATION_CLOSED',
            'Teams can only be invited while registrations are open',
          );
        const teamRows = await manager.query<
          { exists: boolean; hasCaptain: boolean }[]
        >(
          `SELECT EXISTS(SELECT 1 FROM public.team WHERE id=$1) AS exists,
             EXISTS(SELECT 1 FROM public.user_team
               WHERE team_id=$1 AND role='captain') AS "hasCaptain"`,
          [teamId],
        );
        if (!teamRows[0]?.exists)
          throw new DomainError(
            'not_found',
            'TEAM_NOT_FOUND',
            'Team not found',
          );
        if (!teamRows[0].hasCaptain)
          throw new DomainError(
            'conflict',
            'TEAM_HAS_NO_CAPTAIN',
            'This team has no captain who can respond to the invitation',
          );
        const registered = await manager.query<{ exists: boolean }[]>(
          `SELECT EXISTS(SELECT 1 FROM public.league_team
           WHERE league_id=$1 AND team_id=$2) AS exists`,
          [leagueId, teamId],
        );
        if (registered[0].exists)
          throw new DomainError(
            'conflict',
            'TEAM_ALREADY_REGISTERED',
            'This team is already registered',
          );
        const current = await manager.query<{ id: string; status: string }[]>(
          `SELECT id::text AS id, status
           FROM public.league_team_invitation
           WHERE league_id=$1 AND team_id=$2 FOR UPDATE`,
          [leagueId, teamId],
        );
        if (current[0]?.status === 'pending')
          throw new DomainError(
            'conflict',
            'TEAM_INVITATION_PENDING',
            'An invitation for this team is already pending',
          );
        if (current.length) {
          await manager.query(
            `UPDATE public.league_team_invitation
             SET invited_by=$2, status='pending', invited_at=now(),
                 responded_at=NULL
             WHERE id=$1`,
            [current[0].id, actor],
          );
        } else {
          await manager.query(
            `INSERT INTO public.league_team_invitation
             (league_id, team_id, invited_by) VALUES ($1, $2, $3)`,
            [leagueId, teamId, actor],
          );
        }
      }),
    );
  }

  async teamInvitations(actor: string): Promise<LeagueTeamInvitationView[]> {
    return this.source.query<LeagueTeamInvitationView[]>(
      `SELECT DISTINCT invitation.id::text AS id,
         invitation.league_id::text AS "leagueId",
         league.name AS "leagueName", invitation.team_id::text AS "teamId",
         team.name AS "teamName", invitation.invited_at AS "invitedAt"
       FROM public.league_team_invitation invitation
       JOIN public.league ON league.id=invitation.league_id
       JOIN public.team ON team.id=invitation.team_id
       JOIN public.user_team membership ON membership.team_id=team.id
         AND membership.user_id=$1 AND membership.role='captain'
       WHERE invitation.status='pending' AND league.status='open'
       ORDER BY invitation.invited_at, invitation.id`,
      [actor],
    );
  }

  async respondToTeamInvitation(
    actor: string,
    invitationId: string,
    action: 'accept' | 'decline',
  ) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const rows = await manager.query<
          {
            leagueId: string;
            leagueStatus: string;
            teamId: string;
            captain: boolean;
            invitationStatus: string;
          }[]
        >(
          `SELECT invitation.league_id::text AS "leagueId",
             league.status AS "leagueStatus", invitation.team_id::text AS "teamId",
             invitation.status AS "invitationStatus",
             EXISTS(SELECT 1 FROM public.user_team membership
               WHERE membership.team_id=invitation.team_id AND membership.user_id=$2
                 AND membership.role='captain') AS captain
           FROM public.league_team_invitation invitation
           JOIN public.league ON league.id=invitation.league_id
           WHERE invitation.id=$1
           FOR UPDATE OF invitation, league`,
          [invitationId, actor],
        );
        const invitation = rows[0];
        if (!invitation)
          throw new DomainError(
            'not_found',
            'LEAGUE_INVITATION_NOT_FOUND',
            'League invitation not found',
          );
        if (!invitation.captain)
          throw new DomainError(
            'forbidden',
            'LEAGUE_INVITATION_RESPONSE_FORBIDDEN',
            'Only a team captain can respond to this invitation',
          );
        if (invitation.invitationStatus !== 'pending')
          throw new DomainError(
            'conflict',
            'LEAGUE_INVITATION_ALREADY_RESPONDED',
            'This invitation has already been answered',
          );
        if (invitation.leagueStatus !== 'open')
          throw new DomainError(
            'conflict',
            'LEAGUE_REGISTRATION_CLOSED',
            'This league is no longer accepting teams',
          );
        if (action === 'accept') {
          await manager.query(
            `INSERT INTO public.league_team (team_id, league_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [invitation.teamId, invitation.leagueId],
          );
        }
        await manager.query(
          `UPDATE public.league_team_invitation
           SET status=$2, responded_at=now() WHERE id=$1`,
          [invitationId, action === 'accept' ? 'accepted' : 'declined'],
        );
      }),
    );
  }

  async removeTeam(actor: string, leagueId: string, teamId: string) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const leagues = await manager.query<
          { ownerId: string | null; status: string }[]
        >(
          `SELECT owner_id::text AS "ownerId", status
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
        if (league.status !== 'open')
          throw new DomainError(
            'conflict',
            'LEAGUE_REGISTRATION_CLOSED',
            'Teams can only be removed while league registrations are open',
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
      `SELECT arena.id::text AS id, arena.address, arena.image
       FROM public.league l
       JOIN public.sport_arena sa ON sa.sport_id=l.sport_id
       JOIN public.arena arena ON arena.id=sa.arena_id
       WHERE l.id=$1
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
       JOIN public.arena arena ON arena.id=sa.arena_id
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
        if (!['open', 'active'].includes(league.status))
          throw new DomainError(
            'conflict',
            'LEAGUE_ALREADY_FINISHED',
            'Matches cannot be scheduled after the league has been closed',
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
           WHERE arena.id=$1`,
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
        await manager.query(
          `UPDATE public.league SET status='active'
           WHERE id=$1 AND status='open'`,
          [leagueId],
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
            phase: 'manual' | 'group' | 'knockout';
            leagueStatus: string;
          }[]
        >(
          `SELECT l.owner_id::text AS "organizerId",
             lm.appointment_id::text AS "appointmentId",
             lm.home_team_id::text AS "homeTeamId",
             lm.away_team_id::text AS "awayTeamId",
             lm.phase, l.status AS "leagueStatus",
             (a.status <> 'canceled' AND a.scheduled_at <= CURRENT_TIMESTAMP) AS "resultAllowed"
           FROM public.league_match lm
           JOIN public.league l ON l.id=lm.league_id
           JOIN public.appointment a ON a.id=lm.appointment_id
           WHERE lm.league_id=$1 AND lm.id=$2
           FOR UPDATE OF l, lm`,
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
        if (!['open', 'active'].includes(match.leagueStatus))
          throw new DomainError(
            'conflict',
            'LEAGUE_ALREADY_FINISHED',
            'Results cannot be changed after the league has been closed',
          );
        if (match.phase === 'knockout' && input.homeScore === input.awayScore)
          throw new DomainError(
            'invalid',
            'KNOCKOUT_DRAW_NOT_ALLOWED',
            'Knockout matches must have a winner',
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

  async generateFixtures(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
    now: Date,
  ) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const leagues = await manager.query<
          {
            ownerId: string | null;
            name: string;
            sportId: string | null;
            status: string;
            format: LeagueInput['tournamentFormat'];
            groupCount: number;
            qualifiersPerGroup: number;
          }[]
        >(
          `SELECT owner_id::text AS "ownerId", name, sport_id::text AS "sportId",
             status, tournament_format AS format, group_count AS "groupCount",
             qualifiers_per_group AS "qualifiersPerGroup"
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
            'LEAGUE_FIXTURES_FORBIDDEN',
            'Only the organizer can generate fixtures',
          );
        if (league.status !== 'open')
          throw new DomainError(
            'conflict',
            'LEAGUE_NOT_OPEN',
            'Fixtures can only be generated for an open league',
          );
        if (!league.sportId)
          throw new DomainError(
            'conflict',
            'LEAGUE_SPORT_MISSING',
            'The league has no sport configured',
          );
        const existing = await manager.query(
          `SELECT 1 FROM public.league_match WHERE league_id=$1 LIMIT 1`,
          [leagueId],
        );
        if (existing.length)
          throw new DomainError(
            'conflict',
            'LEAGUE_FIXTURES_EXIST',
            'Fixtures have already been generated',
          );
        const teamRows = await manager.query<{ id: string }[]>(
          `SELECT team_id::text AS id FROM public.league_team
           WHERE league_id=$1 ORDER BY team_id`,
          [leagueId],
        );
        const teamIds = teamRows.map((row) => row.id);
        const fixtures = buildInitialFixtures(
          teamIds,
          league.format,
          Number(league.groupCount),
          Number(league.qualifiersPerGroup),
        );
        if (league.format === 'groups_knockout') {
          for (const [index, teamId] of teamIds.entries()) {
            await manager.query(
              `UPDATE public.league_team SET group_number=$3
               WHERE league_id=$1 AND team_id=$2`,
              [leagueId, teamId, (index % Number(league.groupCount)) + 1],
            );
          }
        }
        const sportRows = await manager.query<{ maxPlayers: number }[]>(
          `SELECT default_value_player_numbers AS "maxPlayers"
           FROM public.sport WHERE id=$1`,
          [league.sportId],
        );
        if (!sportRows.length)
          throw new DomainError(
            'not_found',
            'LEAGUE_SPORT_NOT_FOUND',
            'The league sport no longer exists',
          );
        await this.createFixtureAppointments(
          manager,
          actor,
          leagueId,
          {
            name: league.name,
            sportId: league.sportId,
            maxPlayers: sportRows[0].maxPlayers,
          },
          fixtures,
          input,
          now,
          1,
        );
        await manager.query(
          `UPDATE public.league SET status='active' WHERE id=$1`,
          [leagueId],
        );
      }),
    );
  }

  async generateNextRound(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
    now: Date,
  ) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const leagueRows = await manager.query<
          {
            ownerId: string | null;
            name: string;
            sportId: string | null;
            status: string;
            format: LeagueInput['tournamentFormat'];
            groupCount: number;
            qualifiersPerGroup: number;
          }[]
        >(
          `SELECT owner_id::text AS "ownerId", name, sport_id::text AS "sportId",
             status, tournament_format AS format, group_count AS "groupCount",
             qualifiers_per_group AS "qualifiersPerGroup"
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        );
        const league = leagueRows[0];
        if (!league)
          throw new DomainError(
            'not_found',
            'LEAGUE_NOT_FOUND',
            'League not found',
          );
        if (league.ownerId !== actor)
          throw new DomainError(
            'forbidden',
            'LEAGUE_ROUND_FORBIDDEN',
            'Only the organizer can generate a tournament round',
          );
        if (league.status !== 'active')
          throw new DomainError(
            'conflict',
            'LEAGUE_NOT_ACTIVE',
            'The league has no active tournament',
          );
        if (!league.sportId)
          throw new DomainError(
            'conflict',
            'LEAGUE_SPORT_MISSING',
            'The league has no sport configured',
          );
        const matchRows = await manager.query<
          {
            id: string;
            matchNumber: number;
            phase: 'group' | 'knockout' | 'manual';
            roundNumber: number;
            homeTeamId: string;
            awayTeamId: string;
            winnerTeamId: string | null;
          }[]
        >(
          `SELECT lm.id::text AS id, lm.match_number AS "matchNumber",
             lm.phase, lm.round_number AS "roundNumber",
             lm.home_team_id::text AS "homeTeamId",
             lm.away_team_id::text AS "awayTeamId",
             result.winner_team_id::text AS "winnerTeamId"
           FROM public.league_match lm
           JOIN public.appointment a ON a.id=lm.appointment_id
           LEFT JOIN public.appointment_result result ON result.appointment_id=a.id
           WHERE lm.league_id=$1 AND a.status<>'canceled'
           ORDER BY lm.match_number FOR UPDATE OF lm`,
          [leagueId],
        );
        if (
          matchRows.some(
            (match) => !match.winnerTeamId && match.phase === 'knockout',
          )
        ) {
          const unresolved = await manager.query<{ missing: number }[]>(
            `SELECT count(*)::int AS missing
             FROM public.league_match lm
             JOIN public.appointment a ON a.id=lm.appointment_id
             LEFT JOIN public.appointment_result r ON r.appointment_id=a.id
             WHERE lm.league_id=$1 AND lm.phase='knockout'
               AND lm.round_number=(SELECT max(round_number) FROM public.league_match
                 WHERE league_id=$1 AND phase='knockout')
               AND (r.id IS NULL OR r.winner_team_id IS NULL)`,
            [leagueId],
          );
          if (Number(unresolved[0].missing))
            throw new DomainError(
              'conflict',
              'LEAGUE_ROUND_INCOMPLETE',
              'Every match in the current knockout round needs a winner before advancing',
            );
        }

        let fixtures: Fixture[];
        let nextRound: number;
        const knockoutMatches = matchRows.filter(
          (match) => match.phase === 'knockout',
        );
        if (
          league.format === 'groups_knockout' &&
          knockoutMatches.length === 0
        ) {
          const groupMatches = matchRows.filter(
            (match) => match.phase === 'group',
          );
          if (
            !groupMatches.length ||
            groupMatches.some((match) => !match.id || !match.winnerTeamId)
          ) {
            const missing = await manager.query<{ missing: number }[]>(
              `SELECT count(*)::int AS missing
               FROM public.league_match lm
               JOIN public.appointment a ON a.id=lm.appointment_id
               LEFT JOIN public.appointment_result r ON r.appointment_id=a.id
               WHERE lm.league_id=$1 AND lm.phase='group' AND a.status<>'canceled'
                 AND r.id IS NULL`,
              [leagueId],
            );
            if (Number(missing[0]?.missing) > 0)
              throw new DomainError(
                'conflict',
                'LEAGUE_GROUPS_INCOMPLETE',
                'All group matches must have a result before qualification',
              );
          }
          const standings = await manager.query<
            {
              teamId: string;
              groupNumber: number;
              points: number;
              wins: number;
              scoreDifference: number;
            }[]
          >(
            `SELECT t.id::text AS "teamId", lt.group_number AS "groupNumber",
               (count(r.id) FILTER (WHERE r.winner_team_id=t.id) * 3
                 + count(r.id) FILTER (WHERE r.id IS NOT NULL AND r.winner_team_id IS NULL))::int AS points,
               count(r.id) FILTER (WHERE r.winner_team_id=t.id)::int AS wins,
               (COALESCE(sum(CASE
                 WHEN r.winner_team_id=t.id THEN r.winner_score-r.loser_score
                 WHEN r.loser_team_id=t.id THEN r.loser_score-r.winner_score
                 WHEN r.id IS NOT NULL AND lm.home_team_id=t.id THEN r.winner_score-r.loser_score
                 WHEN r.id IS NOT NULL AND lm.away_team_id=t.id THEN r.loser_score-r.winner_score
                 ELSE 0 END), 0))::int AS "scoreDifference"
             FROM public.league_team lt
             JOIN public.team t ON t.id=lt.team_id
             LEFT JOIN public.league_match lm ON lm.league_id=lt.league_id
               AND lm.phase='group' AND t.id IN (lm.home_team_id, lm.away_team_id)
             LEFT JOIN public.appointment_result r ON r.appointment_id=lm.appointment_id
             WHERE lt.league_id=$1
             GROUP BY t.id, lt.group_number
             ORDER BY lt.group_number, points DESC, wins DESC, "scoreDifference" DESC, t.id`,
            [leagueId],
          );
          const selected: string[] = [];
          for (let group = 1; group <= Number(league.groupCount); group += 1) {
            const groupTeams = standings.filter(
              (standing) => Number(standing.groupNumber) === group,
            );
            selected.push(
              ...groupTeams
                .slice(0, Number(league.qualifiersPerGroup))
                .map((standing) => standing.teamId),
            );
          }
          if (!selected.length)
            throw new DomainError(
              'conflict',
              'LEAGUE_GROUPS_MISSING',
              'No group standings are available',
            );
          fixtures = buildKnockoutFixtures(selected, 1);
          nextRound = 1;
        } else {
          if (!knockoutMatches.length)
            throw new DomainError(
              'conflict',
              'LEAGUE_KNOCKOUT_NOT_STARTED',
              'Generate the initial fixtures before advancing',
            );
          const currentRound = Math.max(
            ...knockoutMatches.map((match) => Number(match.roundNumber)),
          );
          const currentMatches = knockoutMatches.filter(
            (match) => Number(match.roundNumber) === currentRound,
          );
          if (currentMatches.some((match) => !match.winnerTeamId))
            throw new DomainError(
              'conflict',
              'LEAGUE_ROUND_INCOMPLETE',
              'Every match in the current knockout round needs a winner before advancing',
            );
          if (currentMatches.length === 1)
            throw new DomainError(
              'conflict',
              'LEAGUE_TOURNAMENT_FINISHED',
              'The final has already been completed',
            );
          fixtures = buildKnockoutFixtures(
            currentMatches.map((match) => match.winnerTeamId!),
            currentRound + 1,
          );
          nextRound = currentRound + 1;
        }

        const teamRows = await manager.query<{ id: string }[]>(
          `SELECT team_id::text AS id FROM public.league_team WHERE league_id=$1`,
          [leagueId],
        );
        assertTournamentConfiguration(
          league.format,
          teamRows.length,
          Number(league.groupCount),
          Number(league.qualifiersPerGroup),
        );
        const sportRows = await manager.query<{ maxPlayers: number }[]>(
          `SELECT default_value_player_numbers AS "maxPlayers"
           FROM public.sport WHERE id=$1`,
          [league.sportId],
        );
        const lastNumber = Math.max(
          ...matchRows.map((match) => Number(match.matchNumber)),
          0,
        );
        await this.createFixtureAppointments(
          manager,
          actor,
          leagueId,
          {
            name: league.name,
            sportId: league.sportId,
            maxPlayers: sportRows[0].maxPlayers,
          },
          fixtures.map((fixture) => ({ ...fixture, roundNumber: nextRound })),
          input,
          now,
          lastNumber + 1,
        );
      }),
    );
  }

  async rescheduleMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueMatchInput,
    now: Date,
  ) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const rows = await manager.query<
          {
            ownerId: string | null;
            appointmentId: string;
            homeTeamId: string;
            awayTeamId: string;
            sportId: string | null;
            leagueStatus: string;
            status: string;
            scheduledAt: Date;
            hasResult: boolean;
          }[]
        >(
          `SELECT l.owner_id::text AS "ownerId",
             lm.appointment_id::text AS "appointmentId",
             lm.home_team_id::text AS "homeTeamId",
             lm.away_team_id::text AS "awayTeamId", l.sport_id::text AS "sportId",
             l.status AS "leagueStatus", a.status,
             a.scheduled_at AS "scheduledAt",
             EXISTS(SELECT 1 FROM public.appointment_result r
               WHERE r.appointment_id=a.id) AS "hasResult"
           FROM public.league_match lm
           JOIN public.league l ON l.id=lm.league_id
           JOIN public.appointment a ON a.id=lm.appointment_id
           WHERE lm.league_id=$1 AND lm.id=$2
           FOR UPDATE OF l, lm, a`,
          [leagueId, matchId],
        );
        const match = rows[0];
        if (!match)
          throw new DomainError(
            'not_found',
            'LEAGUE_MATCH_NOT_FOUND',
            'Match not found',
          );
        if (match.ownerId !== actor)
          throw new DomainError(
            'forbidden',
            'LEAGUE_MATCH_UPDATE_FORBIDDEN',
            'Only the organizer can reschedule this match',
          );
        if (!['open', 'active'].includes(match.leagueStatus))
          throw new DomainError(
            'conflict',
            'LEAGUE_ALREADY_FINISHED',
            'Matches cannot be changed after the league has been closed',
          );
        if (
          match.hasResult ||
          match.status !== 'scheduled' ||
          new Date(match.scheduledAt) <= now
        )
          throw new DomainError(
            'conflict',
            'LEAGUE_MATCH_NOT_RESCHEDULABLE',
            'Only future matches without results can be rescheduled',
          );
        if (
          input.homeTeamId !== match.homeTeamId ||
          input.awayTeamId !== match.awayTeamId
        )
          throw new DomainError(
            'invalid',
            'LEAGUE_TEAMS_IMMUTABLE',
            'Rescheduling cannot change the competing teams',
          );
        if (!match.sportId)
          throw new DomainError(
            'conflict',
            'LEAGUE_SPORT_MISSING',
            'The league has no sport configured',
          );
        const arenaRows = await manager.query<
          { lat: string; longitude: string }[]
        >(
          `SELECT arena.lat::text AS lat, arena.longitude::text AS longitude
           FROM public.arena arena
           JOIN public.sport_arena sa ON sa.arena_id=arena.id AND sa.sport_id=$2
           WHERE arena.id=$1`,
          [input.arenaId, match.sportId],
        );
        if (!arenaRows.length)
          throw new DomainError(
            'invalid',
            'LEAGUE_ARENA_UNAVAILABLE',
            'Choose an arena reserved for leagues and supporting this sport',
          );
        const scheduleRows = await manager.query<{ horary: string }[]>(
          `SELECT horary FROM public.schedule WHERE id=$1`,
          [input.scheduleId],
        );
        if (!scheduleRows.length)
          throw new DomainError(
            'not_found',
            'SCHEDULE_NOT_FOUND',
            'Schedule not found',
          );
        const scheduledAt = new Date(
          `${input.date}T${scheduleRows[0].horary}Z`,
        );
        assertFutureSlot(scheduledAt, now);
        const slots = await manager.query<{ available: boolean }[]>(
          `SELECT NOT EXISTS (
             SELECT 1 FROM public.appointment
             WHERE arena_id=$1 AND scheduled_at=$2 AND id<>$3
               AND deleted_at IS NULL AND status IN ('scheduled', 'in_progress')
           ) AS available`,
          [input.arenaId, scheduledAt, match.appointmentId],
        );
        if (!slots[0].available)
          throw new DomainError(
            'conflict',
            'ARENA_SLOT_TAKEN',
            'The selected arena and time are no longer available',
          );
        await manager.query(
          `UPDATE public.appointment SET
             scheduled_at=$2, arena_id=$3, schedule_id=$4,
             location=ST_SetSRID(ST_MakePoint($5, $6), 0), updated_at=now()
           WHERE id=$1`,
          [
            match.appointmentId,
            scheduledAt,
            input.arenaId,
            input.scheduleId,
            arenaRows[0].longitude,
            arenaRows[0].lat,
          ],
        );
      }),
    );
  }

  async cancelMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    now: Date,
  ) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const rows = await manager.query<
          {
            ownerId: string | null;
            leagueStatus: string;
            appointmentId: string;
            status: string;
            scheduledAt: Date;
            hasResult: boolean;
            phase: string;
          }[]
        >(
          `SELECT l.owner_id::text AS "ownerId", l.status AS "leagueStatus",
             a.id::text AS "appointmentId", lm.phase,
             a.status, a.scheduled_at AS "scheduledAt",
             EXISTS(SELECT 1 FROM public.appointment_result r
               WHERE r.appointment_id=a.id) AS "hasResult"
           FROM public.league_match lm
           JOIN public.league l ON l.id=lm.league_id
           JOIN public.appointment a ON a.id=lm.appointment_id
           WHERE lm.league_id=$1 AND lm.id=$2
           FOR UPDATE OF l, lm, a`,
          [leagueId, matchId],
        );
        const match = rows[0];
        if (!match)
          throw new DomainError(
            'not_found',
            'LEAGUE_MATCH_NOT_FOUND',
            'Match not found',
          );
        if (match.ownerId !== actor)
          throw new DomainError(
            'forbidden',
            'LEAGUE_MATCH_CANCEL_FORBIDDEN',
            'Only the organizer can cancel this match',
          );
        if (!['open', 'active'].includes(match.leagueStatus))
          throw new DomainError(
            'conflict',
            'LEAGUE_ALREADY_FINISHED',
            'Matches cannot be changed after the league has been closed',
          );
        if (match.phase !== 'manual')
          throw new DomainError(
            'conflict',
            'TOURNAMENT_MATCH_CANNOT_BE_CANCELED',
            'Tournament fixtures must be rescheduled or the league canceled to preserve the bracket',
          );
        if (
          match.status !== 'scheduled' ||
          match.hasResult ||
          new Date(match.scheduledAt) <= now
        )
          throw new DomainError(
            'conflict',
            'LEAGUE_MATCH_NOT_CANCELLABLE',
            'Only future matches without results can be canceled',
          );
        await manager.query(
          `UPDATE public.appointment SET status='canceled', updated_at=now()
           WHERE id=$1`,
          [match.appointmentId],
        );
      }),
    );
  }

  async finish(
    actor: string,
    leagueId: string,
    status: 'completed' | 'canceled',
  ) {
    await databaseWrite(() =>
      this.source.transaction(async (manager) => {
        const rows = await manager.query<
          { ownerId: string | null; status: string; format: string }[]
        >(
          `SELECT owner_id::text AS "ownerId", status, tournament_format AS format
           FROM public.league WHERE id=$1 FOR UPDATE`,
          [leagueId],
        );
        const league = rows[0];
        if (!league)
          throw new DomainError(
            'not_found',
            'LEAGUE_NOT_FOUND',
            'League not found',
          );
        if (league.ownerId !== actor)
          throw new DomainError(
            'forbidden',
            'LEAGUE_FINISH_FORBIDDEN',
            'Only the organizer can finish this league',
          );
        if (!['open', 'active'].includes(league.status))
          throw new DomainError(
            'conflict',
            'LEAGUE_ALREADY_FINISHED',
            'This league is already closed',
          );
        if (status === 'completed') {
          const incomplete = await manager.query<{ count: number }[]>(
            `SELECT count(*)::int AS count
             FROM public.league_match lm
             JOIN public.appointment a ON a.id=lm.appointment_id
             LEFT JOIN public.appointment_result r ON r.appointment_id=a.id
             WHERE lm.league_id=$1 AND a.status<>'canceled' AND r.id IS NULL`,
            [leagueId],
          );
          const matchCount = await manager.query<{ count: number }[]>(
            `SELECT count(*)::int AS count FROM public.league_match
             WHERE league_id=$1`,
            [leagueId],
          );
          const finalRows = await manager.query<{ count: number }[]>(
            `SELECT count(*)::int AS count
             FROM public.league_match lm
             JOIN public.appointment a ON a.id=lm.appointment_id
             JOIN public.appointment_result r ON r.appointment_id=a.id
             WHERE lm.league_id=$1 AND lm.phase='knockout'
               AND lm.round_number=(SELECT max(round_number) FROM public.league_match
                 WHERE league_id=$1 AND phase='knockout')
               AND a.status='finished' AND r.winner_team_id IS NOT NULL`,
            [leagueId],
          );
          if (
            Number(matchCount[0]?.count ?? 0) === 0 ||
            Number(incomplete[0].count) > 0 ||
            (league.format !== 'round_robin' &&
              Number(finalRows[0]?.count ?? 0) !== 1)
          )
            throw new DomainError(
              'conflict',
              'LEAGUE_MATCHES_INCOMPLETE',
              'All scheduled matches and the tournament final must be completed before closing the league',
            );
        } else {
          await manager.query(
            `UPDATE public.appointment SET status='canceled', updated_at=now()
             WHERE id IN (SELECT appointment_id FROM public.league_match WHERE league_id=$1)
               AND status='scheduled'`,
            [leagueId],
          );
        }
        await manager.query(`UPDATE public.league SET status=$2 WHERE id=$1`, [
          leagueId,
          status,
        ]);
      }),
    );
  }
}
