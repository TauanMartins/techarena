import { DomainError } from '../../../common/domain/domain-error.js';

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
