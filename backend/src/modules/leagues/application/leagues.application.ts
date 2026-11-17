import { assertCalendarDate } from '../../appointments/domain/booking-policy.js';
import type { ProfileAccess } from '../../users/profile/application/ports/profile-access.port.js';
import type { LeagueUseCases } from './ports/leagues.port.js';
import {
  assertDifferentTeams,
  assertFixtureSchedule,
  assertTournamentOptions,
  assertValidScores,
} from '../domain/league-policy.js';
import type {
  FixtureScheduleInput,
  LeagueAvailabilityQuery,
  LeagueInput,
  LeagueMatchInput,
  LeagueResultInput,
  LeagueTeamInvitationView,
  LeagueUpdateInput,
} from '../domain/league.js';
import { normalizeLeagueUpdate } from '../domain/normalize-league-update.js';

export class LeaguesApplication {
  constructor(
    private readonly operations: LeagueUseCases,
    private readonly profiles: ProfileAccess,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(actor: string) {
    return this.operations.list(actor);
  }

  details(actor: string, leagueId: string) {
    return this.operations.details(actor, leagueId);
  }

  async create(actor: string, input: LeagueInput) {
    await this.profiles.ensureAdult(actor);
    assertTournamentOptions(
      input.tournamentFormat,
      input.groupCount ?? 2,
      input.qualifiersPerGroup ?? 2,
    );
    return this.operations.create(actor, {
      ...input,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    });
  }

  async update(actor: string, leagueId: string, input: LeagueUpdateInput) {
    await this.profiles.ensureExists(actor);
    return this.operations.update(
      actor,
      leagueId,
      normalizeLeagueUpdate(input),
    );
  }

  async registerTeam(actor: string, leagueId: string, teamId: string) {
    await this.profiles.ensureAdult(actor);
    await this.operations.registerTeam(actor, leagueId, teamId);
  }

  inviteTeam(actor: string, leagueId: string, teamId: string) {
    return this.operations.inviteTeam(actor, leagueId, teamId);
  }

  teamInvitations(actor: string): Promise<LeagueTeamInvitationView[]> {
    return this.operations.teamInvitations(actor);
  }

  async respondToTeamInvitation(
    actor: string,
    invitationId: string,
    action: 'accept' | 'decline',
  ) {
    if (action === 'accept') await this.profiles.ensureAdult(actor);
    else await this.profiles.ensureExists(actor);
    return this.operations.respondToTeamInvitation(actor, invitationId, action);
  }

  removeTeam(actor: string, leagueId: string, teamId: string) {
    return this.operations.removeTeam(actor, leagueId, teamId);
  }

  arenas(leagueId: string) {
    return this.operations.arenas(leagueId);
  }

  async availability(leagueId: string, query: LeagueAvailabilityQuery) {
    assertCalendarDate(query.date);
    return {
      items: await this.operations.availability(leagueId, query, this.now()),
    };
  }

  async createMatch(actor: string, leagueId: string, input: LeagueMatchInput) {
    assertCalendarDate(input.date);
    assertDifferentTeams(input.homeTeamId, input.awayTeamId);
    await this.operations.createMatch(actor, leagueId, input, this.now);
  }

  async recordResult(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueResultInput,
  ) {
    assertValidScores(input.homeScore, input.awayScore);
    await this.operations.recordResult(actor, leagueId, matchId, input);
  }

  async generateFixtures(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
  ) {
    assertCalendarDate(input.date);
    assertFixtureSchedule(input);
    await this.operations.generateFixtures(actor, leagueId, input, this.now);
  }

  async generateNextRound(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
  ) {
    assertCalendarDate(input.date);
    assertFixtureSchedule(input);
    await this.operations.generateNextRound(actor, leagueId, input, this.now);
  }

  async rescheduleMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueMatchInput,
  ) {
    assertCalendarDate(input.date);
    assertDifferentTeams(input.homeTeamId, input.awayTeamId);
    await this.operations.rescheduleMatch(
      actor,
      leagueId,
      matchId,
      input,
      this.now,
    );
  }

  cancelMatch(actor: string, leagueId: string, matchId: string) {
    return this.operations.cancelMatch(actor, leagueId, matchId, this.now);
  }

  finish(actor: string, leagueId: string, status: 'completed' | 'canceled') {
    return this.operations.finish(actor, leagueId, status);
  }
}
