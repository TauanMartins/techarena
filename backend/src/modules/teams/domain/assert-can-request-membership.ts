import { DomainError } from '../../../common/domain/domain-error.js';

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
