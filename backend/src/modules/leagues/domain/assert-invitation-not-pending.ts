import { DomainError } from '../../../common/domain/domain-error.js';
export function assertInvitationNotPending(status: string | undefined) {
  if (status === 'pending')
    throw new DomainError(
      'conflict',
      'TEAM_INVITATION_PENDING',
      'An invitation for this team is already pending',
    );
}
