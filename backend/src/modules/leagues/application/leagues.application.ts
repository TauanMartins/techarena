import { assertCalendarDate } from '../../appointments/domain/booking-policy.js';
import {
  assertDifferentTeams,
  assertValidScores,
} from '../domain/league-policy.js';
import type {
  LeagueAvailabilityQuery,
  LeagueInput,
  LeagueMatchInput,
  LeagueResultInput,
  LeaguesRepository,
} from '../domain/leagues.port.js';
import type { ProfileAccess } from '../../users/profile/application/profile-access.port.js';

export class LeaguesApplication {
  constructor(
    private readonly repository: LeaguesRepository,
    private readonly profiles: ProfileAccess,
    private readonly now: () => Date = () => new Date(),
  ) {}

  list(actor: string) {
    return this.repository.list(actor);
  }

  details(actor: string, leagueId: string) {
    return this.repository.details(actor, leagueId);
  }

  async create(actor: string, input: LeagueInput) {
    await this.profiles.ensureAdult(actor);
    return this.repository.create(actor, {
      ...input,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    });
  }

  async registerTeam(actor: string, leagueId: string, teamId: string) {
    await this.profiles.ensureAdult(actor);
    await this.repository.registerTeam(actor, leagueId, teamId);
  }

  removeTeam(actor: string, leagueId: string, teamId: string) {
    return this.repository.removeTeam(actor, leagueId, teamId);
  }

  arenas(leagueId: string) {
    return this.repository.arenas(leagueId);
  }

  async availability(leagueId: string, query: LeagueAvailabilityQuery) {
    assertCalendarDate(query.date);
    return {
      items: await this.repository.availability(leagueId, query, this.now()),
    };
  }

  async createMatch(actor: string, leagueId: string, input: LeagueMatchInput) {
    assertCalendarDate(input.date);
    assertDifferentTeams(input.homeTeamId, input.awayTeamId);
    await this.repository.createMatch(actor, leagueId, input, this.now());
  }

  async recordResult(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueResultInput,
  ) {
    assertValidScores(input.homeScore, input.awayScore);
    await this.repository.recordResult(actor, leagueId, matchId, input);
  }
}
