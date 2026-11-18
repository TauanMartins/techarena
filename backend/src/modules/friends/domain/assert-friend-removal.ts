import { DomainError } from '../../../common/domain/domain-error.js';
export function assertFriendRemoval(
  actor: string,
  state: { requesterId: string; addresseeId: string; status: string } | null,
) {
  if (!state)
    throw new DomainError(
      'not_found',
      'FRIEND_NOT_FOUND',
      'Amizade não encontrada.',
    );
  if (actor !== state.requesterId && actor !== state.addresseeId)
    throw new DomainError(
      'forbidden',
      'NOT_A_PARTY',
      'Esta amizade não pertence a você.',
    );
  if (state.status !== 'accepted')
    throw new DomainError(
      'conflict',
      'FRIEND_NOT_ACCEPTED',
      'Somente uma amizade aceita pode ser desfeita. Um bloqueio não pode ser removido por esta ação.',
    );
  return actor === state.requesterId ? state.addresseeId : state.requesterId;
}
