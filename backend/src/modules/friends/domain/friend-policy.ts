import { DomainError } from '../../../common/domain/domain-error.js';
export function assertFriendDecision(
  actor: string,
  row: { requesterId: string; addresseeId: string; status: string },
  action: 'accept' | 'block',
): void {
  if (actor !== row.requesterId && actor !== row.addresseeId)
    throw new DomainError(
      'forbidden',
      'NOT_A_PARTY',
      'This friendship does not belong to you',
    );
  if (action === 'accept' && actor !== row.addresseeId)
    throw new DomainError(
      'forbidden',
      'RECIPIENT_REQUIRED',
      'Only the recipient can accept the request',
    );
  if (action === 'accept' && row.status !== 'pending')
    throw new DomainError(
      'conflict',
      'REQUEST_CLOSED',
      'Friend request is not pending',
    );
}

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
export function friendshipOutcome(
  actor: string,
  state: { requesterId: string; addresseeId: string; status: string } | null,
  action: 'accept' | 'block',
) {
  if (!state)
    throw new DomainError(
      'not_found',
      'FRIEND_NOT_FOUND',
      'Friend relationship not found',
    );
  assertFriendDecision(actor, state, action);
  return action === 'accept' ? ('accepted' as const) : ('blocked' as const);
}
