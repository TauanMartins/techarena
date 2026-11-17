import type {
  FixtureScheduleInput,
  LeagueAvailabilityQuery,
  LeagueInput,
  LeagueMatchInput,
  LeagueResultInput,
  LeagueUpdateInput,
} from '../domain/league.js';
import type { LeagueUseCases } from './ports/leagues.port.js';
import { arenas } from './operations/arenas.js';
import { availability } from './operations/availability.js';
import { cancelMatch } from './operations/cancel-match.js';
import { createMatch } from './operations/create-match.js';
import { create } from './operations/create.js';
import { details } from './operations/details.js';
import { finish } from './operations/finish.js';
import { generateFixtures } from './operations/generate-fixtures.js';
import { generateNextRound } from './operations/generate-next-round.js';
import { inviteTeam } from './operations/invite-team.js';
import { list } from './operations/list.js';
import { recordResult } from './operations/record-result.js';
import { registerTeam } from './operations/register-team.js';
import { removeTeam } from './operations/remove-team.js';
import { rescheduleMatch } from './operations/reschedule-match.js';
import { respondToTeamInvitation } from './operations/respond-to-team-invitation.js';
import { teamInvitations } from './operations/team-invitations.js';
import { update } from './operations/update.js';
import type { LeagueStore } from './ports/league-store.port.js';
export class LeagueOperations implements LeagueUseCases {
  constructor(private readonly store: LeagueStore) {}
  list(actor: string) {
    return list(this.store, actor);
  }
  details(actor: string, leagueId: string) {
    return details(this.store, actor, leagueId);
  }
  create(actor: string, input: LeagueInput) {
    return create(this.store, actor, input);
  }
  update(actor: string, leagueId: string, input: LeagueUpdateInput) {
    return update(this.store, actor, leagueId, input);
  }
  registerTeam(actor: string, leagueId: string, teamId: string) {
    return registerTeam(this.store, actor, leagueId, teamId);
  }
  inviteTeam(actor: string, leagueId: string, teamId: string) {
    return inviteTeam(this.store, actor, leagueId, teamId);
  }
  teamInvitations(actor: string) {
    return teamInvitations(this.store, actor);
  }
  respondToTeamInvitation(
    actor: string,
    invitationId: string,
    action: 'accept' | 'decline',
  ) {
    return respondToTeamInvitation(this.store, actor, invitationId, action);
  }
  removeTeam(actor: string, leagueId: string, teamId: string) {
    return removeTeam(this.store, actor, leagueId, teamId);
  }
  arenas(leagueId: string) {
    return arenas(this.store, leagueId);
  }
  availability(leagueId: string, query: LeagueAvailabilityQuery, now: Date) {
    return availability(this.store, leagueId, query, now);
  }
  createMatch(
    actor: string,
    leagueId: string,
    input: LeagueMatchInput,
    clock: () => Date,
  ) {
    return createMatch(this.store, actor, leagueId, input, clock);
  }
  recordResult(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueResultInput,
  ) {
    return recordResult(this.store, actor, leagueId, matchId, input);
  }
  generateFixtures(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
    clock: () => Date,
  ) {
    return generateFixtures(this.store, actor, leagueId, input, clock);
  }
  generateNextRound(
    actor: string,
    leagueId: string,
    input: FixtureScheduleInput,
    clock: () => Date,
  ) {
    return generateNextRound(this.store, actor, leagueId, input, clock);
  }
  rescheduleMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    input: LeagueMatchInput,
    clock: () => Date,
  ) {
    return rescheduleMatch(this.store, actor, leagueId, matchId, input, clock);
  }
  cancelMatch(
    actor: string,
    leagueId: string,
    matchId: string,
    clock: () => Date,
  ) {
    return cancelMatch(this.store, actor, leagueId, matchId, clock);
  }
  finish(actor: string, leagueId: string, status: 'completed' | 'canceled') {
    return finish(this.store, actor, leagueId, status);
  }
}
