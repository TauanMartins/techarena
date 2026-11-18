import { DomainError } from '../../../common/domain/domain-error.js';
export function assertMemberRemoval(
  actor: string,
  target: string,
  actorCaptain: boolean,
  targetCaptain: boolean,
  targetMember: boolean,
) {
  if (!targetMember)
    throw new DomainError(
      'not_found',
      'MEMBER_NOT_FOUND',
      'Este atleta não participa da equipe.',
    );
  if (actor !== target && !actorCaptain)
    throw new DomainError(
      'forbidden',
      'CAPTAIN_REQUIRED',
      'Somente o capitão pode remover membros.',
    );
  if (targetCaptain)
    throw new DomainError(
      'conflict',
      'CAPTAIN_CANNOT_LEAVE',
      'O capitão não pode sair ou ser removido. Exclua a equipe se deseja encerrá-la.',
    );
}
