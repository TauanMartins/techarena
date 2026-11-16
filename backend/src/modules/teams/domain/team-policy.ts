import { DomainError } from '../../../common/domain/domain-error.js';
export function assertMembershipDecision(
  kind: 'invitation' | 'request',
  actor: string,
  target: string,
  isCaptain: boolean,
): void {
  if (
    (kind === 'request' && !isCaptain) ||
    (kind === 'invitation' && actor !== target)
  )
    throw new DomainError(
      'forbidden',
      'WRONG_APPROVER',
      'Only the receiving party can decide this membership request',
    );
}

export function normalizeTeam(input: import('./team.js').TeamInput) {
  const name = input.name.trim();
  if (!name || name.length > 45)
    throw new DomainError(
      'invalid',
      'INVALID_TEAM_NAME',
      'Provide a team name with at most 45 characters',
    );
  return { ...input, name };
}
export function assertTeamExists(team: unknown): asserts team {
  if (!team)
    throw new DomainError('not_found', 'TEAM_NOT_FOUND', 'Team not found');
}
export function assertCaptain(isCaptain: boolean) {
  if (!isCaptain)
    throw new DomainError(
      'forbidden',
      'CAPTAIN_REQUIRED',
      'Only a team captain can perform this action',
    );
}
export function assertCanRequestMembership(
  userExists: boolean,
  isMember: boolean,
  hasPending: boolean,
) {
  if (!userExists)
    throw new DomainError('not_found', 'USER_NOT_FOUND', 'User not found');
  if (isMember)
    throw new DomainError(
      'conflict',
      'ALREADY_MEMBER',
      'User is already a member',
    );
  if (hasPending)
    throw new DomainError(
      'conflict',
      'REQUEST_PENDING',
      'A membership decision is already pending',
    );
}
export function membershipOutcome(
  request: { status: string },
  decision: 'accept' | 'decline',
) {
  if (request.status !== 'pending')
    throw new DomainError(
      'conflict',
      'REQUEST_CLOSED',
      'Membership request was already decided',
    );
  return {
    addMember: decision === 'accept',
    status:
      decision === 'accept' ? ('accepted' as const) : ('declined' as const),
  };
}
