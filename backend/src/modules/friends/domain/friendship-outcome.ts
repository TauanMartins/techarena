import { DomainError } from '../../../common/domain/domain-error.js';
import { assertFriendDecision } from './assert-friend-decision.js';
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
