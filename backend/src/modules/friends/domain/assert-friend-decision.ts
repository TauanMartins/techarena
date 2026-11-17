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
