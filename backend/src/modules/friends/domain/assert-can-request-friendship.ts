import { DomainError } from '../../../common/domain/domain-error.js';

export function assertCanRequestFriendship(
  actor: string,
  userId: string,
  userExists: boolean,
  relationshipExists: boolean,
) {
  if (actor === userId)
    throw new DomainError(
      'invalid',
      'SELF_FRIENDSHIP',
      'You cannot add yourself',
    );
  if (!userExists)
    throw new DomainError('not_found', 'USER_NOT_FOUND', 'User not found');
  if (relationshipExists)
    throw new DomainError(
      'conflict',
      'RELATIONSHIP_EXISTS',
      'A relationship already exists',
    );
}
