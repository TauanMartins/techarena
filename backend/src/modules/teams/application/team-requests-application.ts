import { DomainError } from '../../../common/domain/domain-error.js';
import type { PageRequest } from '../../../common/domain/pagination.js';
import { assertPageRequest } from '../../../common/domain/pagination.js';
import type { ProfileAccess } from '../../users/profile/application/ports/profile-access.port.js';
import type { TeamsRepository } from './ports/teams.port.js';
import {
  assertCanRequestMembership,
  assertCaptain,
  assertMembershipDecision,
  assertTeamExists,
  membershipOutcome,
} from '../domain/team-policy.js';
import type { MembershipDecision } from '../domain/team.js';
import type { MembershipRecord, TeamTransaction } from './ports/teams.port.js';

export class TeamRequestsApplication {
  constructor(
    private readonly repository: TeamsRepository,
    private readonly profiles: ProfileAccess,
  ) {}
  async invite(actor: string, teamId: string, userId: string) {
    await this.profiles.ensureExists(actor);
    return this.repository.transaction(async (store) => {
      assertTeamExists(await store.lockTeam(teamId));
      assertCaptain(await store.isCaptain(actor, teamId));
      return this.pending(store, actor, teamId, userId, 'invitation');
    });
  }
  async decide(
    actor: string,
    teamId: string,
    userId: string,
    decision: MembershipDecision,
  ) {
    await this.profiles.ensureExists(actor);
    return this.repository.transaction(async (store) => {
      assertTeamExists(await store.lockTeam(teamId));
      assertCaptain(await store.isCaptain(actor, teamId));
      const row = await store.pending(teamId, userId);
      if (!row)
        throw new DomainError(
          'not_found',
          'REQUEST_NOT_FOUND',
          'Pending membership request not found',
        );
      if (row.kind !== 'request')
        throw new DomainError(
          'conflict',
          'INVITATION_REQUIRES_USER',
          'The invited user must answer this invitation',
        );
      assertMembershipDecision(row.kind, actor, row.userId, true);
      return this.resolve(store, row, decision);
    });
  }
  async request(actor: string, teamId: string) {
    await this.profiles.ensureAdult(actor);
    return this.repository.transaction(async (store) => {
      assertTeamExists(await store.lockTeam(teamId));
      return this.pending(store, actor, teamId, actor, 'request');
    });
  }
  async respond(actor: string, id: string, decision: MembershipDecision) {
    if (decision === 'accept') await this.profiles.ensureAdult(actor);
    else await this.profiles.ensureExists(actor);
    return this.repository.transaction(async (store) => {
      const initial = await store.request(id);
      if (!initial)
        throw new DomainError(
          'not_found',
          'REQUEST_NOT_FOUND',
          'Membership request not found',
        );
      assertTeamExists(await store.lockTeam(initial.teamId));
      const row = await store.request(id);
      if (!row)
        throw new DomainError(
          'not_found',
          'REQUEST_NOT_FOUND',
          'Membership request not found',
        );
      assertMembershipDecision(row.kind, actor, row.userId, false);
      assertCaptain(await store.isCaptain(row.createdBy, row.teamId));
      return this.resolve(store, row, decision);
    });
  }
  async list(actor: string, query: PageRequest, teamId?: string) {
    await this.profiles.ensureExists(actor);
    assertPageRequest(query);
    return this.repository.requests(actor, query, teamId);
  }

  private async pending(
    store: TeamTransaction,
    actor: string,
    teamId: string,
    userId: string,
    kind: 'invitation' | 'request',
  ) {
    assertCanRequestMembership(
      await store.userExists(userId),
      await store.isMember(userId, teamId),
      Boolean(await store.pending(teamId, userId)),
    );
    const id = await store.createRequest({
      teamId,
      userId,
      createdBy: actor,
      kind,
      status: 'pending',
    });
    return store.presentRequest(id);
  }
  private async resolve(
    store: TeamTransaction,
    row: MembershipRecord,
    decision: MembershipDecision,
  ) {
    const outcome = membershipOutcome(row, decision);
    if (outcome.addMember)
      await store.addMember(row.teamId, row.userId, 'member');
    await store.setRequestStatus(row.id, outcome.status);
    return store.presentRequest(row.id);
  }
  async members(teamId: string, query: PageRequest) {
    assertPageRequest(query);
    return this.repository.members(teamId, query);
  }
}
